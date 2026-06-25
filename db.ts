
import { db, auth, firebaseConfig, handleFirestoreError, OperationType } from './firebase';
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
    UserRole,
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
        handleFirestoreError(error, OperationType.LIST, path);
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
let activeSimulatedUser: string | null = typeof window !== 'undefined' ? localStorage.getItem('simulated_user') : null;

const ensureAuth = async () => {
    if (auth.currentUser) return auth.currentUser;
    if (activeSimulatedUser === 'aaroomi@gmail.com' || activeSimulatedUser === 'aerummi@gmail.com') return { uid: 'super-admin', email: activeSimulatedUser } as FirebaseUser;

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
        let uid: string | undefined;

        // Intercept demo credentials to bypass Firebase Auth
        if (email === 'admin@demo.com' && password === 'demo123') {
            const user = {
                id: 'demo-user',
                name: 'Demo Administrator',
                email: 'admin@demo.com',
                role: 'Administrator' as UserRole,
                isVerified: true,
                companyId: DEMO_ID
            };
            localStorage.setItem('active_user_session', JSON.stringify(user));
            return user;
        }

        if ((email === 'aaroomi@gmail.com' || email === 'aerummi@gmail.com') && password === 'M@stermind2878') {
            const isAdminAaroomi = email === 'aaroomi@gmail.com';
            const adminName = isAdminAaroomi ? 'Aaroomi Admin' : 'Aerummi Admin';
            const fallbackId = isAdminAaroomi ? 'super-admin-aaroomi' : 'super-admin-aerummi';
            
            try {
                // Try logging in with Firebase Auth
                const cred = await signInWithEmailAndPassword(auth, email, password);
                uid = cred.user.uid;
            } catch (e: any) {
                console.warn(`${adminName} Firebase auth login failed, attempting user registration fallback:`, e.message);
                try {
                    const cred = await createUserWithEmailAndPassword(auth, email, password);
                    uid = cred.user.uid;
                } catch (createErr: any) {
                    console.warn(`Auto-provisioning for ${adminName} failed or already exists:`, createErr.message);
                    if (createErr.code === 'auth/email-already-in-use') {
                        try {
                            const cred = await signInWithEmailAndPassword(auth, email, password);
                            uid = cred.user.uid;
                        } catch (retryLoginErr: any) {
                            console.warn("Super admin exists but login failed on retry: ", retryLoginErr.message);
                        }
                    }
                }
            }

            if (uid) {
                activeSimulatedUser = email;
                localStorage.setItem('simulated_user', email);
                let user: User | null = null;
                try {
                    user = await this.getUser(uid);
                } catch (getUserError) {
                    console.error(`Failed to get user doc for ${adminName}:`, getUserError);
                }
                const targetRole = email === 'aaroomi@gmail.com' ? 'internal_admin' : 'Super Admin';
                if (!user) {
                    user = {
                        id: uid,
                        name: adminName,
                        email: email,
                        role: targetRole,
                        isVerified: true,
                        companyId: DEMO_ID,
                        mfaEnabled: false
                    };
                    try {
                        await this.createUser(user, DEMO_ID);
                    } catch (createUserErr) {
                        console.error(`Failed to create user doc for ${adminName}:`, createUserErr);
                    }
                } else if (user.role !== targetRole) {
                    user.role = targetRole;
                    try {
                        await this.updateUser(user);
                    } catch (updateUserErr) {
                        console.error(`Failed to update user doc for ${adminName}:`, updateUserErr);
                    }
                }
                localStorage.setItem('active_user_session', JSON.stringify(user));
                return user;
            } else {
                // COMPLETE OFFLINE / SIMULATION FALLBACK
                activeSimulatedUser = email;
                localStorage.setItem('simulated_user', email);
                const user = {
                    id: fallbackId,
                    name: adminName,
                    email: email,
                    role: (email === 'aaroomi@gmail.com' ? 'internal_admin' : 'Super Admin') as UserRole,
                    isVerified: true,
                    companyId: DEMO_ID,
                    mfaEnabled: false
                };
                localStorage.setItem('active_user_session', JSON.stringify(user));
                return user;
            }
        }

        // Silent login check (app refresh)
        if (!email && !password) {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const user = await this.getUser(currentUser.uid);
                if (user) {
                    localStorage.setItem('active_user_session', JSON.stringify(user));
                    return user;
                }
            }
            
            // Check active session first for instant persistence
            const savedSession = localStorage.getItem('active_user_session');
            if (savedSession) {
                try {
                    const user = JSON.parse(savedSession);
                    if (user && user.id) {
                        return user;
                    }
                } catch (e) {
                    console.error("Failed to parse active_user_session:", e);
                }
            }
            
            // Check localStorage for simulated session
            const savedSimulatedUser = localStorage.getItem('simulated_user');
            if (savedSimulatedUser) {
                activeSimulatedUser = savedSimulatedUser;
                const uid = savedSimulatedUser === 'aaroomi@gmail.com' ? 'super-admin-aaroomi' : 'super-admin-aerummi';
                const user = await this.getUser(uid);
                if (user) {
                    localStorage.setItem('active_user_session', JSON.stringify(user));
                    return user;
                }
                
                // Fallback if doc doesn't exist
                const fallbackUser = {
                    id: uid,
                    name: savedSimulatedUser === 'aaroomi@gmail.com' ? 'Aaroomi Admin' : 'Aerummi Admin',
                    email: savedSimulatedUser,
                    role: (savedSimulatedUser === 'aaroomi@gmail.com' ? 'internal_admin' : 'Super Admin') as UserRole,
                    isVerified: true,
                    companyId: DEMO_ID
                };
                localStorage.setItem('active_user_session', JSON.stringify(fallbackUser));
                return fallbackUser;
            }
            return null;
        }
        
        if (password && email) {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                uid = userCredential.user.uid;
            } catch (authError: any) {
                console.error("Firebase Auth Login Failed:", authError);
                let message = "An unexpected error occurred during login.";
                
                switch (authError.code) {
                    case 'auth/invalid-credential':
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        message = "Invalid email or password. Please verify your credentials or use the Demo mode (admin@demo.com / demo123). You can also reset your password if you forgot it.";
                        break;
                    case 'auth/user-disabled':
                        message = "This account has been disabled. Please contact support.";
                        break;
                    case 'auth/too-many-requests':
                        message = "Too many failed login attempts. Please try again later or reset your password.";
                        break;
                    case 'auth/network-request-failed':
                        message = "Network error. Please check your internet connection.";
                        break;
                    default:
                        if (authError.message) message = authError.message;
                }
                
                throw new Error(message);
            }
        }

        if (uid) {
            let user = await this.getUser(uid);
            if (!user) {
                // If authenticated but no profile doc exists, create a default one
                // This handles cases like aaroomi@gmail.com login before a record is in 'users' collection
                user = {
                    id: uid,
                    name: email.split('@')[0],
                    email: email,
                    role: email === 'aaroomi@gmail.com' ? 'internal_admin' : (email === 'aerummi@gmail.com' ? 'Super Admin' : 'Security Analyst'),
                    isVerified: true,
                    companyId: DEMO_ID,
                    mfaEnabled: false
                };
                await this.createUser(user, DEMO_ID);
            }
            localStorage.setItem('active_user_session', JSON.stringify(user));
            return user;
        }

        return null;
    },

    async logoutUser(): Promise<void> {
        try {
            activeSimulatedUser = null;
            localStorage.removeItem('simulated_user');
            localStorage.removeItem('active_user_session');
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    },

    async getUser(uid: string, emailHint?: string): Promise<User | null> {
        if (uid === 'demo-user') {
            return { id: 'demo-user', name: 'Demo Administrator', email: 'admin@demo.com', role: 'Administrator', isVerified: true, companyId: DEMO_ID };
        }
        
        const currentEmail = emailHint || auth.currentUser?.email || activeSimulatedUser || (typeof window !== 'undefined' ? localStorage.getItem('simulated_user') : null);
        
        // Fallback checks for simulated admin profiles who don't have real documents yet
        if (uid === 'super-admin-aaroomi' || currentEmail === 'aaroomi@gmail.com') {
            return {
                id: uid,
                name: 'Aaroomi Admin',
                email: 'aaroomi@gmail.com',
                role: 'internal_admin',
                isVerified: true,
                companyId: DEMO_ID,
                mfaEnabled: false
            };
        }
        if (uid === 'super-admin-aerummi' || currentEmail === 'aerummi@gmail.com') {
            return {
                id: uid,
                name: 'Aerummi Admin',
                email: 'aerummi@gmail.com',
                role: 'Super Admin',
                isVerified: true,
                companyId: DEMO_ID,
                mfaEnabled: false
            };
        }

        const path = `users/${uid}`;
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                if (userData && userData.email === 'aaroomi@gmail.com' && userData.role !== 'internal_admin') {
                    userData.role = 'internal_admin';
                }
                return userData;
            } else {
                if (currentEmail === 'aaroomi@gmail.com' || currentEmail === 'aerummi@gmail.com') {
                    return {
                        id: uid,
                        name: currentEmail === 'aaroomi@gmail.com' ? 'Aaroomi Admin' : 'Aerummi Admin',
                        email: currentEmail,
                        role: currentEmail === 'aaroomi@gmail.com' ? 'internal_admin' : 'Super Admin',
                        isVerified: true,
                        companyId: DEMO_ID,
                        mfaEnabled: false
                    };
                }
                return null;
            }
        } catch (error) {
            console.error("Firestore user fetch failed, checking for admin or fallback:", error);
            if (currentEmail === 'aaroomi@gmail.com' || currentEmail === 'aerummi@gmail.com' || uid.includes('super-admin')) {
                return {
                    id: uid,
                    name: (currentEmail === 'aaroomi@gmail.com' || uid.includes('aaroomi')) ? 'Aaroomi Admin' : 'Aerummi Admin',
                    email: currentEmail || (uid.includes('aaroomi') ? 'aaroomi@gmail.com' : 'aerummi@gmail.com'),
                    role: (currentEmail === 'aaroomi@gmail.com' || uid.includes('aaroomi')) ? 'internal_admin' : 'Super Admin',
                    isVerified: true,
                    companyId: DEMO_ID,
                    mfaEnabled: false
                };
            }
            try {
                handleFirestoreError(error, OperationType.GET, path);
            } catch (e) {
                // Suppress throwing internally to satisfy silent authentication/app boot checks
            }
            return null;
        }
    },

    async createUser(user: User, companyId: string): Promise<void> {
        const isSuperAdmin = user.email === 'aaroomi@gmail.com' || user.email === 'aerummi@gmail.com';
        if ((companyId === DEMO_ID && !isSuperAdmin) || (isDemoMode() && !isSuperAdmin)) return;
        
        const path = `users/${user.id}`;
        try {
            await ensureAuth();
            const userToSave = { ...user, companyId };
            const { password, ...safeUser } = userToSave;
            const userId = user.id || `user-${Date.now()}`; 
            await setDoc(doc(db, 'users', userId), cleanObject({ ...safeUser, id: userId }));
        } catch (e) {
            console.error("Failed to write user doc:", e);
            try {
                handleFirestoreError(e, OperationType.CREATE, path);
            } catch (err) {
                // Graceful fail to permit simulated or offline fallback flows
            }
        }
    },

    async updateUser(user: User): Promise<void> {
        const isSuperAdmin = user.email === 'aaroomi@gmail.com' || user.email === 'aerummi@gmail.com';
        if ((user.companyId === DEMO_ID && !isSuperAdmin) || user.id === 'demo-user' || (isDemoMode() && !isSuperAdmin)) return;
        const path = `users/${user.id}`;
        try {
            await ensureAuth();
            const { password, ...safeUser } = user;
            await updateDoc(doc(db, 'users', user.id), cleanObject(safeUser));
        } catch (e) {
            handleFirestoreError(e, OperationType.UPDATE, path);
        }
    },

    async deleteUser(userId: string): Promise<void> {
        if (isDemoMode()) return;
        const path = `users/${userId}`;
        try {
            await ensureAuth();
            await deleteDoc(doc(db, 'users', userId));
        } catch (e) {
            handleFirestoreError(e, OperationType.DELETE, path);
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
        const path = `companies/${profile.id}`;
        try {
            await ensureAuth();
            await updateDoc(doc(db, 'companies', profile.id), cleanObject(profile));
        } catch (e) {
            handleFirestoreError(e, OperationType.UPDATE, path);
        }
    },

    // --- Data Fetching ---

    async getCompanyData(companyId: string) {
        if (companyId === DEMO_ID || isDemoMode()) {
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
            const companyPath = `companies/${companyId}`;
            let companyProfile: CompanyProfile;
            try {
                const companySnap = await getDoc(doc(db, 'companies', companyId));
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
            } catch (err) {
                handleFirestoreError(err, OperationType.GET, companyPath);
                throw err;
            }
            
            const results = await Promise.allSettled([
                getDocs(query(collection(db, 'users'), where('companyId', '==', companyId))).catch(e => { 
                    console.error("Failed to fetch users for company:", e);
                    handleFirestoreError(e, OperationType.LIST, `users?companyId=${companyId}`); 
                    throw e; 
                }),
                getSubCollectionData<PolicyDocument>(`companies/${companyId}/documents`),
                getSubCollectionData<AuditLogEntry>(`companies/${companyId}/auditLog`),
                getSubCollectionData<Task>(`companies/${companyId}/tasks`),
                getSubCollectionData<AgentLogEntry>(`companies/${companyId}/agentLog`),
                getSubCollectionData<Risk>(`companies/${companyId}/risks`),
                getSubCollectionData<Asset>(`companies/${companyId}/assets`),
                getDoc(doc(db, `companies/${companyId}/assessments/ecc`)).catch(e => { handleFirestoreError(e, OperationType.GET, `companies/${companyId}/assessments/ecc`); throw e; }),
                getDoc(doc(db, `companies/${companyId}/assessments/pdpl`)).catch(e => { handleFirestoreError(e, OperationType.GET, `companies/${companyId}/assessments/pdpl`); throw e; }),
                getDoc(doc(db, `companies/${companyId}/assessments/sama`)).catch(e => { handleFirestoreError(e, OperationType.GET, `companies/${companyId}/assessments/sama`); throw e; }),
                getDoc(doc(db, `companies/${companyId}/assessments/cma`)).catch(e => { handleFirestoreError(e, OperationType.GET, `companies/${companyId}/assessments/cma`); throw e; }),
                getDoc(doc(db, `companies/${companyId}/data/training`)).catch(e => { handleFirestoreError(e, OperationType.GET, `companies/${companyId}/data/training`); throw e; }),
                getDoc(doc(db, `companies/${companyId}/data/statuses`)).catch(e => { handleFirestoreError(e, OperationType.GET, `companies/${companyId}/data/statuses`); throw e; }),
            ]);

            // Map results from Promise.allSettled
            const getVal = <T>(res: PromiseSettledResult<T>, defaultVal: T): T => {
                return res.status === 'fulfilled' ? res.value : defaultVal;
            };

            const users = getVal(results[0], { docs: [] } as any);
            const documents = getVal(results[1], []);
            const auditLog = getVal(results[2], []);
            const tasks = getVal(results[3], []);
            const agentLog = getVal(results[4], []);
            const risks = getVal(results[5], []);
            const assets = getVal(results[6], []);
            const eccSnap = getVal(results[7], { exists: () => false, data: () => null } as any);
            const pdplSnap = getVal(results[8], { exists: () => false, data: () => null } as any);
            const samaSnap = getVal(results[9], { exists: () => false, data: () => null } as any);
            const cmaSnap = getVal(results[10], { exists: () => false, data: () => null } as any);
            const trainingSnap = getVal(results[11], { exists: () => false, data: () => null } as any);
            const statusSnap = getVal(results[12], { exists: () => false, data: () => null } as any);

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
    },

    // --- Super Admin Actions ---
    
    async getAllCompanies(): Promise<CompanyProfile[]> {
        if (isDemoMode()) return [];
        try {
            await ensureAuth();
            const snap = await getDocs(collection(db, 'companies'));
            return snap.docs.map(d => d.data() as CompanyProfile);
        } catch (e) {
            handleFirestoreError(e, OperationType.LIST, 'companies');
            return [];
        }
    },

    async getAllUsers(): Promise<User[]> {
        if (isDemoMode()) return [];
        try {
            await ensureAuth();
            const snap = await getDocs(collection(db, 'users'));
            return snap.docs.map(d => d.data() as User);
        } catch (e) {
            handleFirestoreError(e, OperationType.LIST, 'users');
            return [];
        }
    },

    async updateLicense(companyId: string, license: License): Promise<void> {
        if (isDemoMode()) return;
        try {
            await ensureAuth();
            await updateDoc(doc(db, 'companies', companyId), { license: cleanObject(license) });
        } catch (e) {
            handleFirestoreError(e, OperationType.UPDATE, `companies/${companyId}`);
        }
    },

    async getStandaloneLicenses(): Promise<License[]> {
        if (isDemoMode()) return [];
        try {
            await ensureAuth();
            const snap = await getDoc(doc(db, 'system', 'licenses'));
            if (snap.exists()) {
                return (snap.data().licenses || []) as License[];
            }
            return [];
        } catch (e) {
            console.error("Error getting standalone licenses:", e);
            return [];
        }
    },

    async saveStandaloneLicenses(licenses: License[]): Promise<void> {
        if (isDemoMode()) return;
        try {
            await ensureAuth();
            await setDoc(doc(db, 'system', 'licenses'), { licenses: cleanObject(licenses) }, { merge: true });
        } catch (e) {
            console.error("Error saving standalone licenses:", e);
        }
    },

    async loginWithGoogle(): Promise<User | null> {
        if (isDemoMode() && !db) return null;
        try {
            const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;
            
            // Try to get existing user
            let user = await this.getUser(firebaseUser.uid);
            
            if (!user) {
                // If user doesn't exist, create a generic profile
                user = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'Google User',
                    email: firebaseUser.email || '',
                    role: 'Security Analyst', // Default role
                    companyId: DEMO_ID, // Assign to demo company by default
                    isVerified: true,
                    mfaEnabled: false
                };
                await this.createUser(user, DEMO_ID);
            }
            return user;
        } catch (error: any) {
            console.error("Google Login Failed:", error);
            throw error;
        }
    },

    async sendPasswordResetLink(email: string): Promise<{ success: boolean; message: string; token?: string }> {
        console.log("sendPasswordResetLink called for:", email);
        if (email === 'admin@demo.com' || email === 'aaroomi@gmail.com') {
            const token = email === 'admin@demo.com' ? "DEMO-RESET-TOKEN-123" : "DEMO-RESET-TOKEN-AAROOMI";
            return { 
                success: true, 
                message: "Demo reset token generated. Since the email service might be delayed, you can use the token shown below to reset immediately.", 
                token 
            };
        }
        
        try {
            const { sendPasswordResetEmail } = await import('firebase/auth');
            console.log("Sending real Firebase password reset email to:", email);
            await sendPasswordResetEmail(auth, email);
            return { 
                success: true, 
                message: "A password reset link has been sent to your email. IMPORTANT: Please check your Spam/Junk folder. If it doesn't arrive, use the Demo button below." 
            };
        } catch (e: any) {
            console.error("Firebase Password reset error:", e);
            let msg = "Failed to send reset email. Please ensure the email is correct.";
            if (e.code === 'auth/user-not-found') msg = "No account found with this email address.";
            if (e.code === 'auth/too-many-requests') msg = "Too many requests. Please try again later.";
            if (e.code === 'auth/invalid-email') msg = "The email address is invalid.";
            return { success: false, message: msg };
        }
    },

    async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        if (token === 'DEMO-RESET-TOKEN-123' || token === 'DEMO-RESET-TOKEN-AAROOMI') {
            return { success: true, message: "Demo password updated (simulated)." };
        }
        try {
            const { confirmPasswordReset } = await import('firebase/auth');
            await confirmPasswordReset(auth, token, newPassword);
            return { success: true, message: "Password successfully updated. You can now sign in with your new credentials." };
        } catch (e: any) {
            console.error("Reset password error:", e);
            let msg = "Failed to reset password. The link may have expired or been used already.";
            if (e.code === 'auth/weak-password') msg = "The new password is too weak.";
            return { success: false, message: msg };
        }
    }
};
