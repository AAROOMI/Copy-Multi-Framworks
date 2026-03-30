import type { TrainingCourse } from '../types';

export const trainingCourses: TrainingCourse[] = [
  // Module 1
  {
    id: 'course-fundamentals',
    title: 'Cybersecurity Fundamentals',
    description: 'Start here. Learn the basic principles of cybersecurity, identify key assets, and understand the threat landscape.',
    standard: 'NCA ECC',
    badgeId: 'fundamentals-badge',
    lessons: [
      {
        id: 'fundamentals-l1',
        title: 'The CIA Triad: Core Principles',
        content: `
# Lesson 1: The CIA Triad

Welcome to Cybersecurity Fundamentals! The foundation of all information security is a model called the **CIA Triad**. It stands for Confidentiality, Integrity, and Availability. Understanding these three principles is the first step to thinking securely.

### Confidentiality
**Confidentiality is about keeping secrets.** It's the principle of ensuring that data is accessible only to authorized individuals. Think of it as digital privacy. Unauthorized disclosure of sensitive information is a breach of confidentiality.

*   **Example:** Your personal health records or the company's financial statements should only be visible to you and other authorized personnel.
*   **How we protect it:** Using strong passwords, encryption (scrambling data so it's unreadable without a key), and access control lists (defining who can see what).

### Integrity
**Integrity is about ensuring data is trustworthy and accurate.** It means preventing unauthorized modification or deletion of information. Data should be reliable and not tampered with.

*   **Example:** The amount of money in your bank account should not be alterable by an attacker. A project plan should not be changed without authorization.
*   **How we protect it:** Using file permissions, checksums (a digital fingerprint for data), version control systems, and blockchain technology.

### Availability
**Availability means that information and systems are accessible when needed by authorized users.** If you can't access your data or services, it's not useful and can halt business operations.

*   **Example:** You should be able to log in to the company's email system during work hours. Our public website must be accessible to customers.
*   **How we protect it:** Using backups, disaster recovery plans, redundant systems (like backup power generators), and protecting against Denial-of-Service (DoS) attacks.
`,
        quiz: {
          title: 'CIA Triad Quick Check',
          questions: [
            {
              question: 'Encrypting a hard drive primarily supports which principle?',
              options: ['Confidentiality', 'Integrity', 'Availability'],
              correctAnswer: 0,
            },
            {
              question: 'Using a digital signature to ensure a document has not been altered relates to which principle?',
              options: ['Confidentiality', 'Integrity', 'Availability'],
              correctAnswer: 1,
            },
             {
              question: 'Having a backup server that takes over if the primary server fails supports which principle?',
              options: ['Confidentiality', 'Integrity', 'Availability'],
              correctAnswer: 2,
            }
          ]
        }
      }
    ]
  },
  // Module 2
  {
    id: 'course-phishing',
    title: 'Phishing & Social Engineering',
    description: 'Learn to identify and protect yourself from phishing attacks, business email compromise, and other social engineering tactics.',
    standard: 'NCA ECC',
    badgeId: 'phishing-badge',
    lessons: [
      {
        id: 'phishing-l1',
        title: 'What is Social Engineering?',
        content: `
# Lesson 1: The Art of Deception

**Social engineering** is the art of manipulating people so they give up confidential information. The criminals are trying to trick you, not your computer. They prey on human psychology—our trust, fear, curiosity, and desire to be helpful.

Phishing is the most common form of social engineering.

### Common Psychological Tricks
- **Authority:** Pretending to be someone important, like a CEO or a government official, to intimidate you into acting.
- **Urgency:** Creating a false sense of emergency (e.g., "Your account will be deleted in 1 hour!") to make you act without thinking.
- **Intimidation/Fear:** Threatening you with negative consequences (e.g., "A warrant has been issued for your arrest") if you don't comply.
- **Scarcity/Greed:** Luring you with an offer that seems too good to be true, like winning a lottery you never entered.
- **Helpfulness:** Posing as a help desk technician and asking for your password to "fix a problem."
`,
        quiz: {
          title: 'Social Engineering Tactics',
          questions: [
            {
              question: 'An attacker pretending to be from the IT help desk and asking for your password is using what tactic?',
              options: ['Urgency', 'Authority', 'Helpfulness'],
              correctAnswer: 2,
            }
          ]
        }
      },
      {
        id: 'phishing-l2',
        title: 'Recognizing Phishing Attacks',
        content: `
# Lesson 2: Spotting the Phish

Phishing is a fraudulent attempt to trick you into revealing sensitive information by disguising as a trustworthy source. Here's how to spot them.

## Red Flags in Emails
- **Sense of Urgency:** Language like "Urgent Action Required" or "Your Account will be Suspended."
- **Generic Greetings:** "Dear Customer" instead of your name.
- **Poor Grammar and Spelling:** Professional organizations proofread their emails.
- **Suspicious Links:** Hover your mouse over a link (don't click!) to see the actual web address. If it doesn't match the sender, it's likely malicious. **Example:** The link text says <code>www.mybank.com</code>, but the hover-link shows <code>www.hacker-site.net/mybank</code>.
- **Unexpected Attachments:** Be wary of attachments you weren't expecting, especially ZIP files or documents that ask you to "Enable Content" or "Enable Macros."
- **Mismatched Sender Address:** The "From" name might say "IT Support," but the email address might be something strange like <code>it-support@hotmail.com</code>.

## Types of Phishing
- **Spear Phishing:** A targeted attack against a specific individual or company. The email will seem much more personal and may reference your name, job title, or recent projects.
- **Whaling:** A type of spear phishing aimed at senior executives (the "big fish").
- **Smishing (SMS Phishing):** Phishing attacks sent via text message.
- **Vishing (Voice Phishing):** Phishing attacks conducted over the phone.
`,
        quiz: {
          title: 'Phishing Recognition Quiz',
          questions: [
            {
              question: 'You receive a text message from an unknown number saying "Your package has a customs fee. Click here to pay: [link]". What is this called?',
              options: ['Whaling', 'Smishing', 'Vishing'],
              correctAnswer: 1,
            },
            {
              question: 'You hover over a link in an email from "Microsoft" and the URL is <code>http://microsft-login.com</code>. What should you do?',
              options: ['Click it to see where it goes', 'Trust it, it looks close enough', 'Delete the email and report it as phishing'],
              correctAnswer: 2,
            }
          ]
        }
      }
    ]
  },
  // Module 3
  {
    id: 'course-malware',
    title: 'Malware Awareness',
    description: 'Understand the different types of malicious software, including ransomware, and learn how to prevent infections.',
    standard: 'SAMA CSF',
    badgeId: 'malware-badge',
    lessons: [
       {
        id: 'malware-l1',
        title: 'The Malware Zoo',
        content: `
# Lesson 1: Understanding Malware

**Malware**, short for malicious software, is any software intentionally designed to cause damage to a computer, server, client, or computer network.

### Common Types of Malware
- **Virus:** A piece of code that attaches itself to a program or file. It relies on human action (like running the program) to spread from one computer to another.
- **Worm:** Similar to a virus, but it can replicate itself without any human interaction. Worms often spread through network vulnerabilities.
- **Trojan Horse:** Disguises itself as legitimate software to trick you into installing it. Once installed, it can create backdoors, steal data, or install other malware.
- **Spyware:** Secretly observes your activities without permission and reports it to the software's author. It can capture keystrokes, screenshots, and login credentials.
- **Adware:** Software that automatically delivers advertisements. While not always malicious, it can be intrusive and sometimes contains spyware.
`,
        quiz: {
            title: 'Malware Types Quiz',
            questions: [
                {
                    question: 'A piece of malware that spreads by itself across the network is called a:',
                    options: ['Virus', 'Trojan', 'Worm'],
                    correctAnswer: 2,
                }
            ]
        }
      },
      {
        id: 'malware-l2',
        title: 'Ransomware: Digital Kidnapping',
        content: `
# Lesson 2: Ransomware Explained

**Ransomware** is one of the most dangerous types of malware. It encrypts a victim's files, making them completely inaccessible. The attacker then demands a ransom payment, usually in cryptocurrency like Bitcoin, in exchange for the decryption key.

## How Ransomware Spreads
- **Phishing Emails:** The most common method. An email contains a malicious link or an attachment (like a fake invoice) that, when opened, installs the ransomware.
- **Exploiting Vulnerabilities:** Attackers scan the internet for systems with unpatched software (like old versions of Windows or web browsers) and exploit those weaknesses to gain entry.
- **Remote Desktop Protocol (RDP):** Poorly secured RDP ports are a favorite target for attackers to gain direct access to a network.

## What to Do in an Attack
1.  **ISOLATE:** Immediately disconnect your computer from the network (unplug the network cable and turn off Wi-Fi) to prevent it from spreading to other computers and network drives.
2.  **REPORT:** Contact the IT/Cybersecurity department immediately. Provide as much detail as you can. **Do not try to fix it yourself.**
3.  **DO NOT PAY:** Paying the ransom is not guaranteed to get your files back. It also funds the criminals and encourages more attacks. Our strategy relies on backups and recovery, not paying criminals.

The best defense is prevention: **keep regular backups**, keep your systems patched, use antivirus software, and be extremely cautious of suspicious emails.
`,
        quiz: {
            title: 'Ransomware Response Quiz',
            questions: [
                {
                    question: 'You see a message on your screen saying your files are encrypted and you must pay to get them back. What is the very FIRST thing you should do?',
                    options: ['Pay the ransom quickly', 'Try to restore from a backup', 'Disconnect the computer from the network', 'Call a colleague for help'],
                    correctAnswer: 2,
                },
                {
                    question: 'Why is it a bad idea to pay the ransom?',
                    options: ['The attacker might ask for more money', 'There is no guarantee you will get your data back', 'It encourages criminals to continue these attacks', 'All of the above'],
                    correctAnswer: 3,
                }
            ]
        }
       }
    ]
  },
  // Module 4
  {
    id: 'course-password',
    title: 'Password & Account Security',
    description: 'Master the art of creating strong passwords and using Multi-Factor Authentication (MFA) to protect your accounts.',
    standard: 'ISO 27001',
    badgeId: 'password-badge',
    lessons: [
       {
        id: 'password-l1',
        title: 'Creating and Managing Strong Passwords',
        content: `
# Lesson 1: Your First Line of Defense

A strong password is your primary defense against unauthorized access. A weak password is like leaving your front door unlocked.

### What Makes a Strong Password?
- **Length:** **Length is the most important factor.** Aim for at least 14 characters. Longer is always better.
- **Complexity:** Use a mix of uppercase letters, lowercase letters, numbers, and symbols (e.g., <code>!@#$%^&</code>).
- **Uniqueness:** **Never reuse passwords across different sites.** If one site is breached, attackers will use that password to try to access your other accounts.
- **Unpredictability:** Avoid dictionary words, personal information (birthdays, names, pet names), and sequential characters ("12345" or "qwerty").

### The Power of Passphrases
Instead of a complex, hard-to-remember password like <code>R7*t$pL9!z</code>, create a **passphrase**. A passphrase is a sequence of words that is easy for you to remember but hard for a computer to guess.
*   **Example:** <code>Correct-Horse-Battery-Staple</code> is extremely strong and much easier to remember.
*   **Tip:** Add numbers and symbols for even more strength: <code>Correct-Horse-Battery-Staple-2024!</code>

### Password Managers: Your Digital Vault
It's impossible to remember dozens of unique, strong passwords. That's why you should use a **password manager**.
*   It generates and securely stores strong passwords for all your accounts.
*   You only need to remember one strong master password to unlock your vault.
*   Examples include Bitwarden, 1Password, and LastPass.
`,
        quiz: {
            title: 'Password Strength Quiz',
            questions: [
                {
                    question: 'What is the single most important factor for a strong password?',
                    options: ['Using a special character', 'Length', 'Starting with a capital letter', 'Containing your birth year'],
                    correctAnswer: 1,
                },
                {
                    question: 'Why is it a bad idea to reuse the same password on multiple websites?',
                    options: ["It's hard to remember which site uses which password", "If one site is breached, attackers can access your other accounts", "It makes the password weaker", "Most websites don't allow it"],
                    correctAnswer: 1,
                }
            ]
        }
       }
    ]
  },
  // Module 5
    {
    id: 'course-browsing',
    title: 'Safe Internet & Email Usage',
    description: 'Learn best practices for browsing the web, using public Wi-Fi, and handling email attachments securely.',
    standard: 'NCA ECC',
    badgeId: 'browsing-badge',
    lessons: [
       {
        id: 'browsing-l1',
        title: 'Navigating the Web Securely',
        content: `
# Lesson 1: Safe Web Browsing

The internet is a vast resource, but not all parts of it are safe. Following these tips can help you avoid common dangers.

### HTTP vs. HTTPS
Always check for **https://** at the beginning of a website's address, especially on pages where you enter sensitive information (like passwords or credit card numbers).
- **HTTP:** Data is sent in plain text. Anyone snooping on the network can read it.
- **HTTPS:** The 'S' stands for 'Secure'. All data between your browser and the site is encrypted. Most modern browsers will show a padlock icon next to the address for HTTPS sites.

### The Dangers of Public Wi-Fi
Public Wi-Fi networks (in cafes, airports, hotels) are inherently insecure. They are often unencrypted, meaning attackers on the same network can easily intercept your traffic. This is called a "Man-in-the-Middle" attack.
- **Best Practice:** Avoid logging into sensitive accounts like banking, email, or company systems on public Wi-Fi.
- **Solution:** Use a **VPN (Virtual Private Network)**. A VPN creates a secure, encrypted tunnel for your internet traffic, protecting it even on an untrusted network.

### Think Before You Click or Download
- **Be cautious of pop-ups,** especially those that claim your computer is infected or that you've won a prize. Close them from your taskbar if you can't find the 'X'.
- **Do not download software from untrusted websites.** Stick to official app stores and vendor websites. Pirated software is a common source of malware.
- **Be wary of shortened URLs** (like from bit.ly or t.co), as you can't see the destination. Use a URL expander tool if you are unsure.
`,
        quiz: {
            title: 'Safe Browsing Quiz',
            questions: [
                {
                    question: 'You are at a coffee shop and need to check your bank account. What is the most secure method?',
                    options: ['Connect to the free public Wi-Fi and log in', 'Use your phone as a mobile hotspot instead of the public Wi-Fi', 'Ask the barista if the Wi-Fi is secure', 'It is safe as long as the bank website is HTTPS'],
                    correctAnswer: 1,
                },
                {
                    question: 'A website offers a free download of expensive software. What is the main risk?',
                    options: ['The download might be slow', 'The software might be an older version', 'The software is likely bundled with malware', 'It might not be compatible with your computer'],
                    correctAnswer: 2,
                }
            ]
        }
       }
    ]
  },
  // Module 6
  {
    id: 'course-remote-work',
    title: 'Physical & Remote Work Security',
    description: 'Secure your physical workspace and home office to protect company data wherever you work.',
    standard: 'PDPL',
    badgeId: 'remote-work-badge',
    lessons: [
       {
        id: 'remote-l1',
        title: 'Securing Your Workspace',
        content: `
# Lesson 1: Security is Physical Too

Cybersecurity isn't just about what happens online. Protecting physical access to devices, documents, and information is a critical part of the puzzle.

### In the Office
- **Clean Desk Policy:** Do not leave sensitive documents (reports, printouts, sticky notes with passwords) on your desk, especially overnight. Store them in locked drawers.
- **Lock Your Screen:** Always lock your computer when you step away. It only takes a few seconds for someone to access an unlocked machine.
  - **Windows Shortcut:** <code>Windows Key + L</code>
  - **Mac Shortcut:** <code>Control + Command + Q</code>
- **Be Aware of Tailgating:** Tailgating is when an unauthorized person follows an authorized person into a secure area. Do not hold a secure door open for someone you don't know. Politely ask them to use their own badge.
- **Visitor Management:** Always escort your visitors and ensure they have a visitor badge. Never leave them unattended in secure areas.

### Working Remotely & In Public
- **Secure Your Home Network:** Change the default administrator password on your home Wi-Fi router. Use a strong WPA2 or WPA3 password.
- **Use a VPN:** Always connect to the company VPN when working remotely. This encrypts your connection and makes it seem as if you are in the office.
- **Separate Work and Personal:** Avoid using work devices for personal activities (like social media or online shopping) and avoid using personal devices for work.
- **Be Mindful of "Shoulder Surfing":** Be aware of your surroundings when working in public places like cafes or airports. Position yourself so that others cannot see your screen. Consider using a privacy screen filter.
- **Secure Storage:** When not in use, store your work laptop and any documents in a secure, locked location at home.
`,
        quiz: {
            title: 'Workspace Security Quiz',
            questions: [
                {
                    question: "What should you do every time you leave your computer, even for a minute?",
                    options: ['Close all your programs', 'Turn off the monitor', 'Log off completely', 'Lock the screen'],
                    correctAnswer: 3,
                },
                {
                    question: 'When working from home, what is the most important tool for securing your connection to the office?',
                    options: ['A fast internet connection', 'A company-approved VPN', 'A new computer', 'Antivirus software'],
                    correctAnswer: 1,
                }
            ]
        }
       }
    ]
  },
  // Module 7
  {
    id: 'course-secure-coding',
    title: 'Secure Coding Practices',
    description: 'Essential guidelines for developers to write secure code and prevent common vulnerabilities like SQL injection and XSS.',
    standard: 'ISO 27001',
    badgeId: 'secure-coding-badge',
    lessons: [
      {
        id: 'secure-coding-l1',
        title: 'Input Validation and Sanitization',
        content: `
# Lesson 1: Never Trust User Input

The number one rule of secure coding is to **never trust data that comes from a user**. Always assume it is malicious until proven otherwise. This is the principle behind input validation and sanitization.

### Input Validation
Input validation is the process of ensuring that data from a user or external source meets a specific set of criteria before it's processed by your application.

*   **Type Checking:** Ensure a number is a number, a date is a date, etc.
*   **Range Checking:** Ensure a number is within an expected range (e.g., age must be between 18 and 120).
*   **Length Checking:** Ensure a username is not more than 50 characters long.
*   **Whitelist Validation:** Only allow known, good characters. For example, a username might only be allowed to contain letters and numbers (<code>[a-zA-Z0-9]</code>). This is much safer than trying to block bad characters (blacklisting).

### Sanitization
Sanitization is the process of cleaning up or modifying user input to make it safe. This is often used as a second layer of defense.

*   **Example:** If a user submits a comment with HTML tags like <code><script></code>, sanitization would remove or encode these tags (e.g., changing <code><</code> to <code>&lt;</code>) to prevent a Cross-Site Scripting (XSS) attack.

**Always validate first, then sanitize as a backup.** A strong validation whitelist is your best defense.
`,
        quiz: {
          title: 'Input Validation Quiz',
          questions: [
            {
              question: 'Which is a more secure approach for validating a username?',
              options: ['Blocking special characters like < and > (Blacklisting)', 'Only allowing letters and numbers (Whitelisting)', 'Checking if the username exists'],
              correctAnswer: 1,
            }
          ]
        }
      }
    ]
  },
  // Module 8
  {
    id: 'course-incident-response',
    title: 'Incident Response Fundamentals',
    description: 'Learn the incident response lifecycle: preparation, identification, containment, eradication, recovery, and lessons learned.',
    standard: 'NCA ECC',
    badgeId: 'incident-response-badge',
    lessons: [
      {
        id: 'incident-response-l1',
        title: 'The Incident Response Lifecycle',
        content: `
# Lesson 1: Responding to a Cyber Attack

When a security incident occurs, a chaotic response can make things worse. A structured **Incident Response (IR) plan** ensures a calm, efficient, and effective reaction. The industry-standard lifecycle has six phases.

### 1. Preparation
This is the work you do **before** an incident. It includes creating the IR plan, forming the response team (CSIRT), and having the right tools (logging, monitoring) in place.

### 2. Identification
How do you know an incident has occurred? This phase involves analyzing events from logs, alerts from security tools, or reports from users to determine if a real security incident is happening.

### 3. Containment
Once an incident is identified, the immediate goal is to stop the bleeding. **Containment** limits the scope and magnitude of the incident. This could mean disconnecting an infected machine from the network or blocking a malicious IP address at the firewall.

### 4. Eradication
After the incident is contained, the next step is to remove the threat from the environment. This involves finding the root cause of the incident and eliminating it. For example, removing malware from all affected systems and patching the vulnerability that allowed it to get in.

### 5. Recovery
This phase focuses on restoring systems to normal operation. This might involve restoring data from backups, rebuilding systems from a known-good state, and monitoring to ensure the threat is truly gone.

### 6. Lessons Learned
After every incident, the team must meet to discuss what happened, what went well, and what could be improved. The goal is to update the IR plan and strengthen defenses to prevent the same incident from happening again. This is a critical step!
`,
        quiz: {
          title: 'IR Lifecycle Quiz',
          questions: [
            {
              question: 'After you discover a computer has been infected with malware, what is the most important immediate step?',
              options: ['Wipe the computer and reinstall Windows', 'Disconnect it from the network to prevent spreading', 'Run a full antivirus scan', 'Try to find out who did it'],
              correctAnswer: 1,
            },
            {
              question: 'Which phase is focused on improving your defenses for the future?',
              options: ['Preparation', 'Recovery', 'Lessons Learned'],
              correctAnswer: 2,
            }
          ]
        }
      }
    ]
  },
  // Module 9
  {
    id: 'course-data-privacy',
    title: 'Data Privacy & PDPL Compliance',
    description: 'An introduction to data privacy principles and the key requirements of the Saudi Personal Data Protection Law (PDPL).',
    standard: 'PDPL',
    badgeId: 'data-privacy-badge',
    lessons: [
      {
        id: 'data-privacy-l1',
        title: 'Key Principles of PDPL',
        content: `
# Lesson 1: Understanding PDPL

The **Saudi Personal Data Protection Law (PDPL)** is a comprehensive data protection regulation that governs the collection, use, and disclosure of personal data of individuals in Saudi Arabia. Understanding its core principles is crucial for compliance.

### Key Principles
- **Lawfulness of Processing & Transparency:** You must have a legal basis (like explicit consent) to process personal data, and you must be transparent with individuals (data subjects) about how you use their data.
- **Purpose Limitation:** You can only collect and process personal data for the specific, explicit purpose that you disclosed to the data subject when you collected it. You can't collect data for one reason and then use it for another.
- **Data Minimization:** You should only collect the personal data that is absolutely necessary to achieve your stated purpose. Don't collect data "just in case" you might need it later.
- **Accuracy:** You must take reasonable steps to ensure that the personal data you hold is accurate, complete, and up-to-date.
- **Storage Limitation:** You must not keep personal data in an identifiable form for longer than is necessary to achieve the purpose for which it was collected.
- **Integrity & Confidentiality:** You must implement appropriate technical and organizational measures to protect personal data against unauthorized access, disclosure, alteration, or destruction.

### Data Subject Rights
PDPL grants several rights to individuals, including:
*   The right to be informed.
*   The right to access their data.
*   The right to request correction of their data.
*   The right to request destruction of their data.
`,
        quiz: {
          title: 'PDPL Principles Quiz',
          questions: [
            {
              question: "The principle that states you should only collect the data you absolutely need is called:",
              options: ['Purpose Limitation', 'Data Minimization', 'Storage Limitation'],
              correctAnswer: 1,
            },
            {
              question: 'Under PDPL, what must you typically obtain before collecting personal data?',
              options: ['The person\'s age', 'Explicit consent', 'Government approval'],
              correctAnswer: 1,
            }
          ]
        }
      }
    ]
  }
];