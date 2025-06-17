// 'use client';

// import { useEffect, useState, useRef } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { usePathname } from 'next/navigation';

// const TARGET_EMAIL = ['mayankmishra11d@gmail.com', 'valueplusmohanlalganj@gmail.com'];
// const POLLING_INTERVAL = 30000; // Poll every 30 seconds

// interface EmailHeader {
//   name: string;
//   value: string;
// }

// interface EmailPayload {
//   headers?: EmailHeader[];
// }

// interface EmailMessage {
//   id?: string;
//   snippet?: string;
//   payload?: EmailPayload;
// }

// interface EmailResponse {
//   message?: EmailMessage;
//   watchSetup?: boolean;
//   authUrl?: string;
// }

// export default function EmailNotifier() {
//   const [isSetup, setIsSetup] = useState(false);
//   const processedEmailsRef = useRef<Set<string>>(new Set());
//   const pathname = usePathname();
//   const isDashboardPage = pathname === '/dashboard';

//   useEffect(() => {
//     if (!isDashboardPage) return;

//     const handleEmailResponse = (data: EmailResponse) => {
//       const newEmailId = data.message?.id;

//       // Skip if no new email or already processed
//       if (!newEmailId || processedEmailsRef.current.has(newEmailId)) return;

//       processedEmailsRef.current.add(newEmailId);

//       const fromEmail = data.message?.payload?.headers?.find(
//         (header: EmailHeader) => header.name === 'From'
//       )?.value || '';

//       if (TARGET_EMAIL.some(email => fromEmail.toLowerCase().includes(email.toLowerCase()))) {
//         console.log(`New email from ${fromEmail}: ${data.message?.snippet}`);
//         toast.info(`New email from ${fromEmail}: ${data.message?.snippet}`);
//       }
//     };

//     const fetchEmailData = async () => {
//       try {
//         const response = await fetch('/api/reader', {
//           method: 'POST',
//         });

//         const data: EmailResponse = await response.json();

//         if (response.status === 401 && data.authUrl) {
//           window.location.href = data.authUrl;
//           return;
//         }

//         if (data.watchSetup && !isSetup) {
//           setIsSetup(true);
//           toast.success('Email notifications set up successfully!');

//           if (data.message?.id) {
//             processedEmailsRef.current.add(data.message.id);
//           }

//           const fromEmail = data.message?.payload?.headers?.find(
//             (header: EmailHeader) => header.name === 'From'
//           )?.value || '';

//           if (TARGET_EMAIL.some(email => fromEmail.toLowerCase().includes(email.toLowerCase()))) {
//             console.log(`Initial email from ${fromEmail}: ${data.message?.snippet}`);
//             toast.info(`New email from ${fromEmail}: ${data.message?.snippet}`);
//           }
//         } else {
//           // Always check for new messages even if watchSetup was already done
//           handleEmailResponse(data);
//         }
//       } catch (error) {
//         console.error('Failed to fetch or poll emails:', error);
//       }
//     };

//     // Initial call
//     fetchEmailData();

//     // Set polling interval
//     const interval = setInterval(fetchEmailData, POLLING_INTERVAL);

//     return () => clearInterval(interval);
//   }, [isSetup, isDashboardPage]);

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

interface EmailHeader {
  name: string;
  value: string;
}

interface EmailPayload {
  headers?: EmailHeader[];
}

interface EmailMessage {
  id?: string;
  snippet?: string;
  payload?: EmailPayload;
}

interface EmailResponse {
  message?: EmailMessage;
  watchSetup?: boolean;
  authUrl?: string;
}

export default function EmailNotifier() {
  const [isSetup, setIsSetup] = useState(false);
  const processedEmailsRef = useRef<Set<string>>(new Set());
  const pathname = usePathname();
  const isDashboardPage = pathname === '/dashboard';

  useEffect(() => {
    if (!isDashboardPage) return;

    const handleEmailResponse = (data: EmailResponse) => {
      const newEmailId = data.message?.id;

      // Skip if no new email or already processed
      if (!newEmailId || processedEmailsRef.current.has(newEmailId)) return;

      processedEmailsRef.current.add(newEmailId);

      const fromEmail = data.message?.payload?.headers?.find(
        (header: EmailHeader) => header.name === 'From'
      )?.value || '';

      if (TARGET_EMAIL.some(email => fromEmail.toLowerCase().includes(email.toLowerCase()))) {
        console.log(`New email from ${fromEmail}: ${data.message?.snippet}`);
        toast.info(`New email from ${fromEmail}: ${data.message?.snippet}`);
      }
    };

    const fetchEmailData = async () => {
      try {
        const response = await fetch('/api/reader', {
          method: 'POST',
        });

        const data: EmailResponse = await response.json();

        if (response.status === 401 && data.authUrl) {
          window.location.href = data.authUrl;
          return;
        }

        if (data.watchSetup && !isSetup) {
          setIsSetup(true);
          toast.success('Email notifications set up successfully!');

          if (data.message?.id) {
            processedEmailsRef.current.add(data.message.id);
          }

          const fromEmail = data.message?.payload?.headers?.find(
            (header: EmailHeader) => header.name === 'From'
          )?.value || '';

          if (TARGET_EMAIL.some(email => fromEmail.toLowerCase().includes(email.toLowerCase()))) {
            console.log(`Initial email from ${fromEmail}: ${data.message?.snippet}`);
            toast.info(`New email from ${fromEmail}: ${data.message?.snippet}`);
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
