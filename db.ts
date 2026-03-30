
import { db, auth, firebaseConfig } from './firebase';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where,
    writeBatch,
    Firestore
} from 'firebase/firestore';
import { 
    onAuthStateChanged, 
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    getAuth,
    signOut
} from 'firebase/auth';
import type { 
    User, 
    CompanyProfile, 
    PolicyDocument, 
    AuditLogEntry, 
    AssessmentItem, 
    Risk, 
    Task, 
    AgentLogEntry, 
    UserTrainingProgress,
    License,
    Asset
} from './types';
import { assessmentData as initialEccData } from './data/assessmentData';
import { initialPdplAssessmentData } from './data/pdplAssessmentData';
import { samaCsfAssessmentData as initialSamaData } from './data/samaCsfAssessmentData';
import { cmaAssessmentData as initialCmaData } from './data/cmaAssessmentData';
import { initialRiskData } from './data/riskAssessmentData';

// Helper to handle potentially missing sub-collections gracefully
const getSubCollectionData = async <T>(path: string): Promise<T[]> => {
    // Prevent fetching demo data from DB to avoid permission errors
    if (path.startsWith('companies/demo-company')) return [];
    try {
        const snapshot = await getDocs(collection(db, path));
        return snapshot.docs.map(doc => doc.data() as T);
    } catch (error: any) {
        console.warn(`Access denied or failed to fetch ${path}. Check permissions.`);
        return [];
    }
};

// Helper to strip undefined values from objects and ensure deep cloning
const cleanObject = (obj: any) => {
    if (obj === undefined || obj === null) return null;
    return JSON.parse(JSON.stringify(obj));
};

// Singleton promise to track auth initialization
let authInitPromise: Promise<FirebaseUser | null> | null = null;

const ensureAuth = async () => {
    if (auth.currentUser) return auth.currentUser;

    // If auth is not initialized, try to wait for it
    if (!authInitPromise) {
        authInitPromise = new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                if (user) {
                    resolve(user);
                } else {
                    resolve(null); 
                }
            }, (error) => {
                unsubscribe();
                authInitPromise = null;
                resolve(null);
            });
        });
    }

    const user = await authInitPromise;
    if (user) return user;

    // Fallback for demo mode
    return { uid: 'demo-user' } as FirebaseUser;
};

const isDemoMode = () => {
    return auth.currentUser === null;
};

const DEMO_ID = 'demo-company';

export const dbAPI = {
    // --- Users & Authentication ---
    
    async loginUser(email: string, password?: string): Promise<User | null> {
        // Intercept demo credentials to bypass Firebase Auth
        if (email === 'admin@demo.com' && password === 'demo123') {
            return {
                id: 'demo-user',
                name: 'Demo Administrator',
                email: 'admin@demo.com',
                role: 'Administrator',
                isVerified: true,
                companyId: DEMO_ID
            };
        }

        // Silent login check (app refresh)
        if (!email && !password) {
            const currentUser = auth.currentUser;
            if (currentUser) {
                return await this.getUser(currentUser.uid);
            }
            return null;
        }
        
        let uid: string | undefined;

        if (password && email) {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                uid = userCredential.user.uid;
            } catch (authError: any) {
                console.error("Firebase Auth Login Failed:", authError);
                return null;
            }
        }

        if (uid) {
            return await this.getUser(uid);
        }

        return null;
    },

    async logoutUser(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    },

    async getUser(uid: string): Promise<User | null> {
        if (uid === 'demo-user') {
            return { id: 'demo-user', name: 'Demo Administrator', email: 'admin@demo.com', role: 'Administrator', isVerified: true, companyId: DEMO_ID };
        }
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return userDoc.data() as User;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    },

    async createUser(user: User, companyId: string): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        const userToSave = { ...user, companyId };
        const { password, ...safeUser } = userToSave;
        
        try {
            const userId = user.id || `user-${Date.now()}`; 
            await setDoc(doc(db, 'users', userId), cleanObject({ ...safeUser, id: userId }));
        } catch (e) {
            console.error("DB Create User failed:", e);
            throw e;
        }
    },

    async updateUser(user: User): Promise<void> {
        if (user.companyId === DEMO_ID || user.id === 'demo-user' || isDemoMode()) return;
        try {
            await ensureAuth();
            const { password, ...safeUser } = user;
            await updateDoc(doc(db, 'users', user.id), cleanObject(safeUser));
        } catch (e) {
            console.error("DB Update User failed:", e);
            throw e;
        }
    },

    async deleteUser(userId: string): Promise<void> {
        if (isDemoMode()) return;
        try {
            await ensureAuth();
            await deleteDoc(doc(db, 'users', userId));
        } catch (e) {
            console.error("DB Delete User failed:", e);
            throw e;
        }
    },

    // --- Company & Setup ---

    async createCompany(profile: CompanyProfile, adminUser: User): Promise<{ user: User, profile: CompanyProfile }> {
        if (profile.id === DEMO_ID) return { user: adminUser, profile }; // Demo fallback

        let uid = adminUser.id;
        
        if (adminUser.password && adminUser.email) {
            if (!auth.currentUser || auth.currentUser.email !== adminUser.email) {
                try {
                    const cred = await createUserWithEmailAndPassword(auth, adminUser.email, adminUser.password);
                    uid = cred.user.uid;
                } catch (e: any) {
                    if (e.code === 'auth/email-already-in-use') {
                        const cred = await signInWithEmailAndPassword(auth, adminUser.email, adminUser.password);
                        uid = cred.user.uid;
                    } else {
                        throw e;
                    }
                }
            } else {
                uid = auth.currentUser.uid;
            }
        } else if (auth.currentUser) {
             uid = auth.currentUser.uid;
        }

        const finalUser: User = {
            ...adminUser,
            id: uid,
            companyId: profile.id,
            role: 'Administrator',
            isVerified: true
        };

        const companyData: CompanyProfile = {
            ...profile,
            ownerId: uid,
            admins: [uid]
        };

        if (!isDemoMode()) {
            try {
                const { password, ...userForDb } = finalUser;
                await setDoc(doc(db, 'users', uid), cleanObject(userForDb), { merge: true });
                await setDoc(doc(db, 'companies', profile.id), cleanObject(companyData));
                
                const batch = writeBatch(db);
                batch.set(doc(db, `companies/${profile.id}/assessments`, 'ecc'), { items: cleanObject(initialEccData) });
                batch.set(doc(db, `companies/${profile.id}/assessments`, 'pdpl'), { items: cleanObject(initialPdplAssessmentData) });
                batch.set(doc(db, `companies/${profile.id}/assessments`, 'sama'), { items: cleanObject(initialSamaData) });
                batch.set(doc(db, `companies/${profile.id}/assessments`, 'cma'), { items: cleanObject(initialCmaData) });
                initialRiskData.forEach(risk => {
                    const riskRef = doc(db, `companies/${profile.id}/risks`, risk.id);
                    batch.set(riskRef, cleanObject(risk));
                });
                await batch.commit();

            } catch (e: any) {
                console.error("Firestore Company Creation Failed:", e);
                throw new Error(`Failed to save company data to database: ${e.message}`);
            }
        }
        
        return { user: finalUser, profile: companyData };
    },

    async createCompanySystem(
        companyData: Omit<CompanyProfile, 'id' | 'license'>, 
        adminData: Omit<User, 'id' | 'role' | 'isVerified'> & { password: string },
        licenseData: License
    ): Promise<void> {
        if (isDemoMode()) {
            console.log("System creation simulated in demo mode.");
            return;
        }

        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);
        
        let newUserUid = "";

        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, adminData.email, adminData.password);
            newUserUid = userCredential.user.uid;
            await signOut(secondaryAuth);
        } catch (e: any) {
            await deleteApp(secondaryApp); 
            if (e.code === 'auth/email-already-in-use') {
                throw new Error("This email is already in use by another account.");
            }
            throw new Error(`Authentication creation failed: ${e.message}`);
        }
        
        await deleteApp(secondaryApp);

        const companyId = `company-${Date.now()}`;
        
        const newCompanyProfile: CompanyProfile = {
            id: companyId,
            ...companyData,
            ownerId: newUserUid,
            admins: [newUserUid],
            license: licenseData
        };

        const newUserProfile: User = {
            id: newUserUid,
            name: adminData.name,
            email: adminData.email,
            role: 'Administrator',
            companyId: companyId,
            isVerified: true, 
            mfaEnabled: false
        };

        try {
            const batch = writeBatch(db);
            const userRef = doc(db, 'users', newUserUid);
            batch.set(userRef, cleanObject(newUserProfile));
            const companyRef = doc(db, 'companies', companyId);
            batch.set(companyRef, cleanObject(newCompanyProfile));
            batch.set(doc(db, `companies/${companyId}/assessments`, 'ecc'), { items: cleanObject(initialEccData) });
            batch.set(doc(db, `companies/${companyId}/assessments`, 'pdpl'), { items: cleanObject(initialPdplAssessmentData) });
            batch.set(doc(db, `companies/${companyId}/assessments`, 'sama'), { items: cleanObject(initialSamaData) });
            batch.set(doc(db, `companies/${companyId}/assessments`, 'cma'), { items: cleanObject(initialCmaData) });
            batch.set(doc(db, `companies/${companyId}/data`, 'statuses'), { 
                ecc: 'idle', pdpl: 'idle', sama: 'idle', cma: 'idle', riskAssessment: 'idle' 
            });
            await batch.commit();
        } catch (e: any) {
            console.error("System Creation Firestore Error:", e);
            throw new Error(`Database write failed: ${e.message}`);
        }
    },

    async updateCompanyProfile(profile: CompanyProfile): Promise<void> {
        if (profile.id === DEMO_ID || isDemoMode()) return;
        try {
            await ensureAuth();
            await updateDoc(doc(db, 'companies', profile.id), cleanObject(profile));
        } catch (e) {
            console.error("Update Company Profile Failed:", e);
            throw e;
        }
    },

    // --- Data Fetching ---

    async getCompanyData(companyId: string) {
        if (companyId === DEMO_ID) {
             return {
                companyProfile: {
                    id: DEMO_ID,
                    name: 'Demo Corp',
                    logo: '',
                    ceoName: 'John Doe',
                    cioName: 'Jane Doe',
                    cisoName: 'Demo Admin',
                    ctoName: 'Tech Lead',
                    license: { key: 'demo', status: 'active', tier: 'yearly', expiresAt: Date.now() + 31536000000 }
                },
                users: [{ id: 'demo-user', name: 'Demo Administrator', email: 'admin@demo.com', role: 'Administrator', isVerified: true, companyId: DEMO_ID }],
                documents: [],
                auditLog: [],
                tasks: [],
                agentLog: [],
                eccAssessment: initialEccData,
                pdplAssessment: initialPdplAssessmentData,
                samaCsfAssessment: initialSamaData,
                cmaAssessment: initialCmaData,
                riskAssessmentData: initialRiskData,
                assets: [
                    { id: 'asset-1', name: 'Web Server 01', type: 'Server', criticality: 'High', owner: 'IT Dept', ipAddress: '192.168.1.10', location: 'Data Center' },
                    { id: 'asset-2', name: 'Finance Database', type: 'Database', criticality: 'Critical', owner: 'Finance Team', ipAddress: '10.0.0.5', location: 'Cloud' }
                ],
                trainingProgress: {},
                assessmentStatuses: { ecc: 'idle', pdpl: 'idle', sama: 'idle', cma: 'idle', riskAssessment: 'idle' }
            };
        }

        await ensureAuth();
        
        try {
            const companySnap = await getDoc(doc(db, 'companies', companyId));
            
            let companyProfile: CompanyProfile;
            if (!companySnap.exists()) {
                console.warn(`Company document ${companyId} not found in DB. Returning partial skeleton.`);
                companyProfile = {
                    id: companyId,
                    name: 'Company Setup Incomplete',
                    logo: '',
                    ceoName: '',
                    cioName: '',
                    cisoName: '',
                    ctoName: '',
                    license: { key: 'trial', status: 'active', tier: 'trial', expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }
                };
            } else {
                companyProfile = companySnap.data() as CompanyProfile;
            }

            const [
                users, documents, auditLog, tasks, agentLog, risks, assets,
                eccSnap, pdplSnap, samaSnap, cmaSnap, trainingSnap, statusSnap
            ] = await Promise.all([
                getDocs(query(collection(db, 'users'), where('companyId', '==', companyId))),
                getSubCollectionData<PolicyDocument>(`companies/${companyId}/documents`),
                getSubCollectionData<AuditLogEntry>(`companies/${companyId}/auditLog`),
                getSubCollectionData<Task>(`companies/${companyId}/tasks`),
                getSubCollectionData<AgentLogEntry>(`companies/${companyId}/agentLog`),
                getSubCollectionData<Risk>(`companies/${companyId}/risks`),
                getSubCollectionData<Asset>(`companies/${companyId}/assets`),
                getDoc(doc(db, `companies/${companyId}/assessments/ecc`)),
                getDoc(doc(db, `companies/${companyId}/assessments/pdpl`)),
                getDoc(doc(db, `companies/${companyId}/assessments/sama`)),
                getDoc(doc(db, `companies/${companyId}/assessments/cma`)),
                getDoc(doc(db, `companies/${companyId}/data/training`)),
                getDoc(doc(db, `companies/${companyId}/data/statuses`)),
            ]);

            const companyUsers = users.docs.map(d => d.data() as User);

            return {
                companyProfile,
                users: companyUsers,
                documents,
                auditLog: auditLog.sort((a, b) => b.timestamp - a.timestamp),
                tasks,
                agentLog: agentLog.sort((a, b) => b.timestamp - a.timestamp),
                eccAssessment: eccSnap.exists() ? eccSnap.data().items : initialEccData,
                pdplAssessment: pdplSnap.exists() ? pdplSnap.data().items : initialPdplAssessmentData,
                samaCsfAssessment: samaSnap.exists() ? samaSnap.data().items : initialSamaData,
                cmaAssessment: cmaSnap.exists() ? cmaSnap.data().items : initialCmaData,
                riskAssessmentData: risks.length > 0 ? risks : initialRiskData,
                assets: assets.length > 0 ? assets : [],
                trainingProgress: trainingSnap.exists() ? trainingSnap.data() : {},
                assessmentStatuses: statusSnap.exists() ? statusSnap.data() : { ecc: 'idle', pdpl: 'idle', sama: 'idle', cma: 'idle', riskAssessment: 'idle' }
            };

        } catch (e) {
            console.error("Failed to fetch company data:", e);
            throw e;
        }
    },

    // --- Operational Updates ---
    
    async saveDocument(companyId: string, document: PolicyDocument): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/documents`, document.id), cleanObject(document));
    },

    async updateDocument(companyId: string, document: PolicyDocument): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await updateDoc(doc(db, `companies/${companyId}/documents`, document.id), cleanObject(document));
    },

    async addAuditLog(companyId: string, entry: AuditLogEntry): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/auditLog`, entry.id), cleanObject(entry));
    },

    async addAgentLog(companyId: string, entry: AgentLogEntry): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/agentLog`, entry.id), cleanObject(entry));
    },

    async addTask(companyId: string, task: Task): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/tasks`, task.id), cleanObject(task));
    },

    async updateTask(companyId: string, task: Task): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await updateDoc(doc(db, `companies/${companyId}/tasks`, task.id), cleanObject(task));
    },

    async deleteTask(companyId: string, taskId: string): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await deleteDoc(doc(db, `companies/${companyId}/tasks`, taskId));
    },

    async saveAssessmentItems(companyId: string, type: 'ecc' | 'pdpl' | 'sama' | 'cma', items: AssessmentItem[]): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/assessments`, type), { items: cleanObject(items) });
    },

    async addRisk(companyId: string, risk: Risk): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/risks`, risk.id), cleanObject(risk));
    },

    async updateRisk(companyId: string, risk: Risk): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await updateDoc(doc(db, `companies/${companyId}/risks`, risk.id), cleanObject(risk));
    },

    async deleteRisk(companyId: string, riskId: string): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await deleteDoc(doc(db, `companies/${companyId}/risks`, riskId));
    },

    async addAsset(companyId: string, asset: Asset): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/assets`, asset.id), cleanObject(asset));
    },

    async updateAsset(companyId: string, asset: Asset): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await updateDoc(doc(db, `companies/${companyId}/assets`, asset.id), cleanObject(asset));
    },

    async deleteAsset(companyId: string, assetId: string): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await deleteDoc(doc(db, `companies/${companyId}/assets`, assetId));
    },

    async updateTrainingProgress(companyId: string, progress: UserTrainingProgress): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/data`, 'training'), cleanObject(progress));
    },

    async updateAssessmentStatus(companyId: string, statuses: any): Promise<void> {
        if (companyId === DEMO_ID || isDemoMode()) return;
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/data`, 'statuses'), cleanObject(statuses));
    }
};
