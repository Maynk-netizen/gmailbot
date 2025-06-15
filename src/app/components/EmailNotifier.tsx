// 'use client';

// import { useEffect, useState, useRef } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { usePathname } from 'next/navigation';
// const TARGET_EMAIL = ['mayankmishra11d@gmail.com',"valueplusmohanlalganj@gmail.com"]; // This is your target email
// // TARGET_EMAIL.push(process.env.EMAIL_ADDRESS || '');
// const POLLING_INTERVAL = 30000; // Poll every 30 seconds

// export default function EmailNotifier() {
//   const [isSetup, setIsSetup] = useState(false);
//   const [processedEmailIds, setProcessedEmailIds] = useState<string[]>([]);
//   // Use a ref to track processed emails between renders
//   const processedEmailsRef = useRef<Set<string>>(new Set());
//   // Get the current pathname to check if we're on the dashboard
//   const pathname = usePathname();
//   const isDashboardPage = pathname === '/dashboard';
  
//   // Set up Gmail push notifications only when on dashboard page
//   useEffect(() => {
//     // Only run this effect if we're on the dashboard page
//     if (!isDashboardPage) return;
    
//     const setupNotifications = async () => {
//       try {
//         const response = await fetch('/api/reader', {
//           method: 'POST',
//         });
        
//         const data = await response.json();
        
//         if (response.status === 401) {
//           // Need authentication
//           window.location.href = data.authUrl;
//           return;
//         }
        
//         if (data.watchSetup) {
//           setIsSetup(true);
//           toast.success('Email notifications set up successfully!');
          
//           // Store the initial email ID to avoid duplicate notifications
//           if (data.message && data.message.id) {
//             processedEmailsRef.current.add(data.message.id);
//             setProcessedEmailIds([...processedEmailsRef.current]);
//           }
          
//           // Check the initial email - only show notification if it's from target
//           const fromEmail = data.message.payload?.headers?.find(
//             (header: any) => header.name === 'From'
//           )?.value || '';
          
//           if (TARGET_EMAIL.some(email => fromEmail.toLowerCase().includes(email.toLowerCase()))) {
//             // Only log and show toast once
//             console.log(`Initial email from ${fromEmail}: ${data.message.snippet}`);
//             toast.info(`New email from ${fromEmail}: ${data.message.snippet}`);
//           }
//         }
//       } catch (error) {
//         console.error('Failed to set up notifications:', error);
//         toast.error('Failed to set up email notifications');
//       }
//     };
    
//     // Set up polling to check for new emails periodically
//     const pollForEmails = async () => {
//       if (!isSetup) return;
      
//       try {
//         const response = await fetch('/api/reader', {
//           method: 'POST',
//         });
        
//         if (response.status !== 200) return;
        
//         const data = await response.json();
//         const newEmailId = data.message?.id;
        
//         // Skip if we've already processed this email
//         if (!newEmailId || processedEmailsRef.current.has(newEmailId)) {
//           return;
//         }
        
//         // Add this email to our processed set
//         processedEmailsRef.current.add(newEmailId);
//         setProcessedEmailIds([...processedEmailsRef.current]);
        
//         // Only show notification if the email is from the target
//         const fromEmail = data.message.payload?.headers?.find(
//           (header: any) => header.name === 'From'
//         )?.value || '';
        
//         if (TARGET_EMAIL.some(email => fromEmail.toLowerCase().includes(email.toLowerCase()))) {
//           // Only log and show toast once for this email
//           console.log(`New email from ${fromEmail}: ${data.message.snippet}`);
//           toast.info(`New email from ${fromEmail}: ${data.message.snippet}`);
//         }
//       } catch (error) {
//         console.error('Failed to poll for emails:', error);
//       }
//     };
    
//     // Only set up notifications if we're on the dashboard page
//     setupNotifications();
    
//     // Start polling only if we're on the dashboard page
//     const interval = setInterval(pollForEmails, POLLING_INTERVAL);
    
//     return () => {
//       clearInterval(interval);
//       // Optionally, you could stop the watch when leaving the dashboard
//       // by making a request to a new endpoint that calls gmail.users.stop
//     };
//   }, [isSetup, isDashboardPage]); // Add isDashboardPage as a dependency
  
//   // Only render the ToastContainer if we're on the dashboard page
//   if (!isDashboardPage) return null;
  
//   return (
//     <div>
//       <ToastContainer position="top-right" autoClose={5000} limit={3} />
//       {isSetup && <div className="hidden">Email notifications are active</div>}
//     </div>
//   );
// }



'use client';

import { useEffect, useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { usePathname } from 'next/navigation';

const TARGET_EMAIL = ['mayankmishra11d@gmail.com', 'valueplusmohanlalganj@gmail.com'];
const POLLING_INTERVAL = 30000; // Poll every 30 seconds

export default function EmailNotifier() {
  const [isSetup, setIsSetup] = useState(false);
  const [processedEmailIds, setProcessedEmailIds] = useState<string[]>([]);
  const processedEmailsRef = useRef<Set<string>>(new Set());
  const pathname = usePathname();
  const isDashboardPage = pathname === '/dashboard';

  useEffect(() => {
    if (!isDashboardPage) return;

    const handleEmailResponse = (data: any) => {
      const newEmailId = data.message?.id;

      // Skip if no new email or already processed
      if (!newEmailId || processedEmailsRef.current.has(newEmailId)) return;

      processedEmailsRef.current.add(newEmailId);
      setProcessedEmailIds([...processedEmailsRef.current]);

      const fromEmail = data.message.payload?.headers?.find(
        (header: any) => header.name === 'From'
      )?.value || '';

      if (TARGET_EMAIL.some(email => fromEmail.toLowerCase().includes(email.toLowerCase()))) {
        console.log(`New email from ${fromEmail}: ${data.message.snippet}`);
        toast.info(`New email from ${fromEmail}: ${data.message.snippet}`);
      }
    };

    const fetchEmailData = async () => {
      try {
        const response = await fetch('/api/reader', {
          method: 'POST',
        });

        const data = await response.json();

        if (response.status === 401 && data.authUrl) {
          window.location.href = data.authUrl;
          return;
        }

        if (data.watchSetup && !isSetup) {
          setIsSetup(true);
          toast.success('Email notifications set up successfully!');

          if (data.message?.id) {
            processedEmailsRef.current.add(data.message.id);
            setProcessedEmailIds([...processedEmailsRef.current]);
          }

          const fromEmail = data.message.payload?.headers?.find(
            (header: any) => header.name === 'From'
          )?.value || '';

          if (TARGET_EMAIL.some(email => fromEmail.toLowerCase().includes(email.toLowerCase()))) {
            console.log(`Initial email from ${fromEmail}: ${data.message.snippet}`);
            toast.info(`New email from ${fromEmail}: ${data.message.snippet}`);
          }
        } else {
          // Always check for new messages even if watchSetup was already done
          handleEmailResponse(data);
        }
      } catch (error) {
        console.error('Failed to fetch or poll emails:', error);
      }
    };

    // Initial call
    fetchEmailData();

    // Set polling interval
    const interval = setInterval(fetchEmailData, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [isSetup, isDashboardPage]);

  if (!isDashboardPage) return null;

  return (
    <div>
      <ToastContainer position="top-right" autoClose={5000} limit={3} />
      {isSetup && <div className="hidden">Email notifications are active</div>}
    </div>
  );
}
