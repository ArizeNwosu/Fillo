
import React from 'react';

export const ReleaseNotesContent = () => (
    <div className="max-w-3xl mx-auto prose prose-invert">
        <h2>Version 2.1.0 <span className="text-[var(--text-secondary)] font-normal italic">- "Phoenix" (September 2025)</span></h2>
        <p className="lead !text-lg !text-[var(--text-secondary)]">This major update introduces several powerful new features and enhancements focused on accessibility, privacy, and customization.</p>
        
        <h3 className="!mt-10 !mb-4 border-b border-[var(--surface-border)] pb-2">New Features</h3>
        <ul>
            <li><strong>Voice Dictation & Read-Aloud:</strong> For enhanced accessibility, you can now use your voice to dictate messages via a new microphone icon in the input bar. Additionally, every AI response has a speaker icon, allowing the application to read the text aloud to you.</li>
            <li><strong>Ephemeral "Off-the-Record" Chats:</strong> For maximum privacy, you can now start "Off-the-Record" chats. These conversations are never saved to your device and are completely erased when you close the browser tab, providing a true "cone of silence" for your most sensitive inquiries.</li>
            <li><strong>Low-Code Custom Module Creator:</strong> You can now build your own specialized AI modules directly within the app. A new "Create Module" interface lets you define a name and a goal, and the application automatically generates a bespoke AI assistant tailored to your unique needs.</li>
            <li><strong>"Executive Summary" on Hover:</strong> To save you time, simply hovering over a past conversation in the chat dropdown will now trigger the AI to generate a concise, one-sentence summary of that chat. This makes it incredibly fast to find the exact conversation you're looking for without opening it.</li>
            <li><strong>Granular Chat Export:</strong> You now have complete control over your data. In addition to the full module export, you can now export individual chats as clean, formatted PDF or simple TXT files, perfect for sharing with advisors or for personal records.</li>
        </ul>

        <h3 className="!mt-10 !mb-4 border-b border-[var(--surface-border)] pb-2">Enhancements & Fixes</h3>
        <ul>
            <li><strong>UI/UX:</strong> Improved responsiveness of hover-activated icons and tooltips for a faster, more fluid user experience.</li>
            <li><strong>Formatting:</strong> Enhanced formatting and readability for all informational pages, including Release Notes and Terms & Policies.</li>
            <li><strong>Performance:</strong> Implemented general performance improvements and bug fixes across all modules.</li>
        </ul>
    </div>
);

export const TermsContent: React.FC<{
    privacyPolicyRef: React.RefObject<HTMLHeadingElement>;
    onScrollToPrivacy: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}> = ({ privacyPolicyRef, onScrollToPrivacy }) => (
    <div className="max-w-3xl mx-auto prose prose-invert">
        <h2 id="terms-of-service">Terms of Service</h2>
        <p><em>Last Updated: 09/10/25</em></p>
        <p>Welcome to Privatas (“Company,” “we,” “our,” or “us”). These Terms of Service (“Terms”) govern your use of our websites, applications, and related services (the “Services”). By accessing or using the Services, you agree to these Terms and our <a href="#privacy-policy" onClick={onScrollToPrivacy} className="text-[var(--accent)] hover:underline">Privacy Policy</a>. <em>If you do not agree, you may not use the Services.</em></p>

        <h3>1. User Responsibilities</h3>
        <p>By using the Services, you agree to:</p>
        <ul>
            <li>Provide <strong>accurate, current, and complete</strong> information when creating an account.</li>
            <li>Keep your login credentials secure and promptly notify us of any unauthorized use.</li>
            <li>Comply with all applicable laws, rules, and regulations in connection with your use of the Services.</li>
            <li>Assume <strong>full responsibility</strong> for all activity under your account, including any User Content you submit.</li>
        </ul>

        <h3>2. Acceptable Use</h3>
        <p>You agree not to, and will not permit others to:</p>
        <ul>
            <li>Use the Services for any <strong>unlawful, fraudulent, or harmful purpose</strong>.</li>
            <li>Upload, transmit, or share content that infringes on another party’s intellectual property, privacy, or rights.</li>
            <li>Attempt to gain unauthorized access to, interfere with, or disrupt the integrity or performance of the Services.</li>
            <li>Reverse engineer, decompile, or disassemble any portion of the Services.</li>
            <li>Use automated systems (e.g., bots, scrapers) without our prior written consent.</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these restrictions.</p>

        <h3>3. Intellectual Property</h3>
        <ul>
            <li><strong>Our Intellectual Property:</strong> All rights, title, and interest in the Services (including software, code, designs, trademarks, and content) are owned by us or our licensors.</li>
            <li><strong>Your Content:</strong> You retain ownership of your User Content but grant us a <em>limited, non-exclusive license</em> to process and display it solely to provide the Services.</li>
            <li>Nothing in these Terms grants you rights to our trademarks, logos, or branding without our prior written consent.</li>
        </ul>

        <h3>4. Termination</h3>
        <p>We may suspend or terminate your access to the Services at our discretion, with or without cause or notice, including if you:</p>
        <ul>
            <li>Breach these Terms,</li>
            <li>Engage in abusive or fraudulent activity, or</li>
            <li>Pose a risk to the security or integrity of the Services.</li>
        </ul>
        <p>Upon termination, your right to use the Services will <strong>immediately cease</strong>.</p>
        
        <h3>5. Disclaimers</h3>
        <ul>
            <li>The Services, including any AI-generated outputs, are provided on an <strong>“AS IS” and “AS AVAILABLE”</strong> basis without warranties of any kind, express or implied.</li>
            <li>We do not guarantee the accuracy, completeness, reliability, or availability of the Services.</li>
            <li>AI outputs are informational only and <em>should not be relied upon as legal, financial, medical, or other regulated advice.</em> Always seek guidance from qualified professionals.</li>
        </ul>

        <h3>6. Limitation of Liability</h3>
        <p>To the maximum extent permitted by law:</p>
        <ul>
            <li>We will not be liable for any <strong>indirect, incidental, special, consequential, or punitive damages</strong>, including lost profits, data, or business opportunities.</li>
            <li>Our total liability for any claim arising out of or related to the Services <strong>will not exceed the amount you paid us in the 12 months preceding the claim.</strong></li>
        </ul>
        <p>Some jurisdictions may not allow certain limitations, so these may not apply to you.</p>

        <h3>7. Governing Law</h3>
        <p>These Terms are governed by the laws of <strong>California</strong>, without regard to conflict of law principles. Any disputes will be resolved exclusively in the courts located in California.</p>
        
        <h3>8. Changes to Terms</h3>
        <p>We may revise these Terms from time to time. If material changes are made, we will notify you by posting updates on our site or through other reasonable means. Continued use of the Services after changes are effective constitutes acceptance of the revised Terms.</p>
        
        <h3>9. Contact</h3>
        <p>If you have questions about these Terms, please contact us at: support@privatas.com</p>

        <h2 ref={privacyPolicyRef} id="privacy-policy" className="!mt-12">Privacy Policy</h2>
        <p><em>Last Updated: 09/10/25</em></p>
        <p>Privatas (“we,” “our,” or “us”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share information when you use our websites, applications, and related services (the “Services”).</p>
        <p>By using the Services, you agree to this Privacy Policy. <em>If you do not agree, please discontinue use of the Services.</em></p>

        <h3>1. Information We Collect</h3>
        <p>We aim to collect as little personal data as possible. The information we may collect includes:</p>
        <ul>
            <li><strong>Account Information:</strong> If you create an account, we may collect your name, email address, and login credentials.</li>
            <li><strong>Usage Data:</strong> We collect anonymized, aggregated data about how you interact with the Services (e.g., page views, feature use, error logs). This data cannot identify you directly.</li>
            <li><strong>Device & Technical Data:</strong> Browser type, operating system, IP address (anonymized), and cookies to help us secure and improve the Services.</li>
            <li><strong>User Content:</strong> Files, text, or data you choose to upload for processing. User Content is processed only to provide the Services and is not shared with third parties.</li>
        </ul>
        <p>We <strong>do not</strong> sell personal data or use it for advertising.</p>

        <h3>2. How We Use Information</h3>
        <p>We use collected data to:</p>
        <ul>
            <li>Provide and improve the Services.</li>
            <li>Personalize your user experience.</li>
            <li>Monitor usage and troubleshoot issues.</li>
            <li>Ensure security, fraud prevention, and compliance with law.</li>
            <li>Communicate service updates, notices, and customer support messages.</li>
        </ul>

        <h3>3. Cookies & Tracking</h3>
        <ul>
            <li>We use <strong>essential cookies</strong> for authentication, security, and core site functionality.</li>
            <li>We may use performance cookies to measure usage and improve features.</li>
            <li>We <strong>do not use advertising or tracking cookies</strong> from third parties.</li>
        </ul>
        <p>You can control or disable cookies through your browser settings. However, some features may not work properly without them.</p>

        <h3>4. Data Retention</h3>
        <ul>
            <li><strong>User Content:</strong> Retained only as long as necessary to provide the Services, and deleted upon your request.</li>
            <li><strong>Account Data:</strong> Stored until you close your account or request deletion.</li>
            <li><strong>Usage Data:</strong> Stored in anonymized, aggregated form for analytics and security purposes.</li>
        </ul>
        <p>We apply strict access controls and encryption to protect stored data.</p>
        
        <h3>5. User Rights (GDPR & CCPA)</h3>
        <p>Depending on your location, you may have the following rights:</p>
        <ul>
            <li><strong>Access & Portability:</strong> Request a copy of your personal data.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data (“right to be forgotten”).</li>
            <li><strong>Restriction:</strong> Request limitation of certain processing activities.</li>
            <li><strong>Objection:</strong> Opt out of data processing for specific purposes.</li>
            <li><strong>Do Not Sell My Personal Information (CCPA):</strong> We do not sell your data, but you may still exercise your rights under CCPA.</li>
        </ul>
        <p>To exercise these rights, contact us at privacy@privitas.com. We will respond within the timelines required by law.</p>

        <h3>6. Data Transfers</h3>
        <p>If you access the Services outside California, your data may be processed in California or other countries where we operate. We use appropriate safeguards (such as Standard Contractual Clauses under GDPR) for international transfers.</p>
        
        <h3>7. Children’s Privacy</h3>
        <p>The Services are not directed to children under 13 (or under 16 in the EU). We do not knowingly collect data from children. If you believe we have done so, please contact us, and we will delete it.</p>
        
        <h3>8. Changes to This Policy</h3>
        <p>We may update this Privacy Policy periodically. If we make significant changes, we will notify you via email or by posting on our site. Continued use of the Services after changes are posted constitutes acceptance of the revised Policy.</p>

        <h3>9. Contact Us</h3>
        <p>For questions or privacy inquiries, please contact us at:</p>
        <p>
            Email: privacy@privatas.com<br />
            Mailing Address: Social Gear Media LLC, 741 Lakefield Road, Suite G, Westlake Village, CA. 91361. USA.
        </p>
    </div>
);

export const faqs = [
    {
        q: "What is Privatas?",
        a: "Privatas is a powerful AI assistant designed with a primary focus on user privacy. It provides specialized AI 'modules' for complex tasks like financial analysis, contract negotiation, and travel planning, all while ensuring your sensitive data is never exposed."
    },
    {
        q: "How is my data kept private?",
        a: "Our core privacy feature is local-first sanitization. When you upload a file or paste text, all scanning for Personally Identifiable Information (PII) happens on your computer. The data is then automatically tokenized or redacted based on your settings. You have full control to review and edit this sanitized version before anything is sent to the AI model. The AI never sees your original, raw data."
    },
    {
        q: "Why did my large or multi-page file (e.g., >10MB or 50+ pages) show up as blank?",
        a: "This is a direct result of our privacy-first design. To protect your data, all file processing happens in your browser. Large files or documents with many pages can exceed your browser's memory and processing limits, causing the text extraction to fail before it can complete. For best results, we recommend splitting large or long documents into smaller chunks (under 10 MB and fewer than 20 pages) before uploading. Anything more might present a blank sanitization screen."
    },
    {
        q: "What are Modules?",
        a: "Modules are specialized AI assistants pre-configured for specific, high-stakes tasks. For example, the 'Negotiation Companion' is trained to analyze contracts, while the 'Health & Longevity' module is designed to interpret lab results. This provides more accurate and relevant insights than a general-purpose chatbot."
    },
    {
        q: "Can I create my own Modules?",
        a: "Yes. The 'Create Custom Module' feature allows you to build your own specialized assistant. Simply provide a name and a goal (e.g., 'Analyze antique furniture listings for authenticity markers'), and our AI will automatically generate a custom Q&A workflow and analysis framework for your new module."
    },
    {
        q: "What kind of files can I upload?",
        a: "Privatas can extract text from PDF documents (.pdf), Microsoft Word files (.docx), plain text files (.txt), and images (.png, .jpg, etc.) using Optical Character Recognition (OCR)."
    },
    {
        q: "Is the AI always accurate?",
        a: "Like all AI systems, Privatas can make mistakes. While it is designed to be a powerful analytical tool, it is not a substitute for professional human advice (legal, financial, medical, etc.). Always verify critical information before making decisions."
    },
    {
        q: "Do you store my conversations?",
        a: "By default, your conversations are saved in your browser's local storage for your convenience, meaning they are stored on your device, not our servers. You can use the 'Off-the-Record' chat mode for conversations that you do not want saved at all, or you can clear all your data at any time from the Settings menu."
    }
];

export const helpArticles = [
    {
        id: 'sanitization',
        title: 'How Data Sanitization Works',
        content: `
            <p class="text-base">Our core privacy feature is designed to ensure that your sensitive personal information never reaches the AI in its original form. This happens through a two-step process: automatic and manual sanitization.</p>
            <h3 class="text-lg font-bold mt-4 mb-2">Automatic Sanitization</h3>
            <p>By default, when you upload a document or paste a large block of text, the application automatically scans for Personally Identifiable Information (PII) on your device. You can set the default sanitization method in Settings:</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Tokenize:</strong> Replaces PII with a descriptive, anonymous placeholder (e.g., "[EMAIL_1]", "[ADDRESS_1]"). This is the recommended mode as it preserves the context for the AI without revealing the actual data.</li>
                <li><strong>Redact:</strong> Replaces PII with black blocks (████). This completely removes the information and its context.</li>
                <li><strong>Delete:</strong> Removes the PII entirely, which can sometimes alter sentence structure.</li>
                <li><strong>None:</strong> Turns off automatic sanitization for the uploaded file.</li>
            </ul>
            <h3 class="text-lg font-bold mt-4 mb-2">Manual Sanitization</h3>
            <p>You always have the final say. After automatic sanitization, the text is presented to you in a "Draft" view. Here, you can:</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Edit the text directly:</strong> You can type, delete, or change any part of the sanitized document.</li>
                <li><strong>Apply granular sanitization:</strong> Highlight any piece of text (whether it was automatically detected or not) and apply a specific sanitization method (Tokenize, Redact, or Delete) just to that selection.</li>
                <li><strong>Revert changes:</strong> If you want to undo all automatic sanitization for a document, you can select the "None" option in the Draft view. However, once you begin manual sanitization, you can no longer run automatic sanitization. To re-run automatic sanitization, you would have to delete the uploaded file and reupload it.</li>
            </ul>
            <p class="mt-4">Only the version of the text you see in the draft editor is sent to the AI when you click "Send." Your original file never leaves your computer.</p>
        `
    },
    {
        id: 'file-size-limits',
        title: 'File Size, Page Count, & Processing Limits',
        content: `
            <p>Because all file processing happens locally in your browser for privacy, the application is subject to the browser's performance limitations. This can affect how large or complex of a document can be processed successfully.</p>
            <h3 class="text-lg font-bold mt-4 mb-2">Why did my file processing fail?</h3>
            <p>If a file appears blank or fails to load, it's typically due to one of two reasons:</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
                <li><strong>File Size:</strong> Very large files (e.g., >10 MB) can consume too much memory for the browser to handle, causing the process to fail. For the optimal experience, we recommend you upload files that are no more than 2-3 MB in size.</li>
                <li><strong>Page Count & Complexity:</strong> For documents like PDFs, a high page count (e.g., 50+ pages) requires the browser to perform a resource-intensive operation for each page. This can lead to timeouts or memory exhaustion, even if the file size is small. We've implemented a 50-page limit to ensure stability; documents larger than this will be truncated.</li>
            </ul>
            <p class="mt-4">You'll now see a progress indicator when processing multi-page documents to provide better feedback during this process.</p>
            <h3 class="text-lg font-bold mt-4 mb-2">Recommendation</h3>
            <p>For optimal performance, we recommend <strong>splitting very large or long documents into smaller chunks</strong> (ideally under 10 MB and fewer than 50 pages) before uploading.</p>
        `
    },
    {
        id: 'voice',
        title: 'Voice Dictation & Read-Aloud',
        content: `
            <p>For enhanced accessibility, you can interact with Privatas using your voice.</p>
            <h3 class="text-lg font-bold mt-4 mb-2">Voice Dictation</h3>
            <p>Click the microphone icon in the text input bar to start dictation. The icon will turn red to indicate it's listening. As you speak, your words will be transcribed into the input field. Click the icon again to stop listening. This requires granting microphone permission to your browser.</p>
            <h3 class="text-lg font-bold mt-4 mb-2">Read-Aloud</h3>
            <p>Every response from the AI has a small speaker icon next to it. Click this icon to have the message read aloud. By default, this uses your device's built-in text-to-speech capabilities. For a more natural voice, you can enable "Enhanced Voice Mode" in the Settings menu, which uses Google's Cloud TTS service.</p>
        `
    },
    {
        id: 'off-the-record',
        title: 'Ephemeral "Off-the-Record" Chats',
        content: `
            <p>This feature provides a "cone of silence" for extremely sensitive, one-off questions where you don't want any record kept, even on your own device.</p>
            <h3 class="text-lg font-bold mt-4 mb-2">How it Works</h3>
            <p>Before starting a new chat, you can toggle the "Off-the-Record" switch in the chat dropdown menu. When enabled:</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
                <li>A new chat is created with a ghost icon to indicate its ephemeral status.</li>
                <li>This conversation is never written to your browser's local storage.</li>
                <li>The entire chat is completely erased from memory when you close the browser tab or switch to another chat.</li>
            </ul>
            <p class="mt-4">It's the digital equivalent of a meeting with no notes taken.</p>
        `
    },
    {
        id: 'custom-modules',
        title: 'Low-Code Custom Module Creator',
        content: `
            <p>You can build your own specialized AI assistants directly within the app, tailored to your unique needs.</p>
            <h3 class="text-lg font-bold mt-4 mb-2">Creating a Module</h3>
            <ol class="list-decimal pl-5 space-y-2 mt-2">
                <li>Open the Module Library and click "Create Custom Module."</li>
                <li><strong>Give it a Name:</strong> A clear, descriptive name (e.g., "Vintage Watch Appraiser").</li>
                <li><strong>Define the Goal:</strong> Describe what you want the module to do in plain English (e.g., "Analyze descriptions and listings of vintage watches to estimate their market value and identify potential restoration needs.").</li>
            </ol>
            <p class="mt-4">The application's AI will take this information and automatically generate a unique icon, a description, a structured Q&A workflow, and the rules for its final "Executive Brief" output. The new module will then be available in your library to use immediately.</p>
        `
    },
    {
        id: 'summary-hover',
        title: 'Executive Summary on Hover',
        content: `
            <p>To help you quickly navigate your conversation history, Privatas can generate on-the-fly summaries.</p>
            <h3 class="text-lg font-bold mt-4 mb-2">How to Use</h3>
            <p>In the main chat view, click the dropdown menu at the top that shows your current chat's name. In the list of previous chats, simply hover your mouse over any chat title. After a brief moment, a tooltip will appear with a concise, one-sentence AI-generated summary of that entire conversation.</p>
            <p class="mt-4">This allows you to find the exact conversation you're looking for without needing to click into and read each one.</p>
        `
    },
    {
        id: 'export',
        title: 'Granular Chat & Brief Export',
        content: `
            <p>You have complete control over your data and can export it for your records or to share with others.</p>
            <h3 class="text-lg font-bold mt-4 mb-2">Exporting an Entire Chat</h3>
            <p>In the chat dropdown menu, several icons appear at the bottom right. You can export the currently active chat as either a plain text (.txt) file or a formatted PDF document.</p>
             <h3 class="text-lg font-bold mt-4 mb-2">Exporting an Executive Brief</h3>
            <p>When a module generates an Executive Brief, a download icon will appear at the top right of the brief. Clicking this allows you to save just the brief itself as a professionally formatted, multi-page PDF.</p>
             <h3 class="text-lg font-bold mt-4 mb-2">Exporting Module History</h3>
            <p>In the Settings menu, you can find an option to "Export Chat History for This Module." This will download a JSON file containing all non-ephemeral chats for the currently active module, which can be used for backup or data analysis.</p>
        `
    }
];