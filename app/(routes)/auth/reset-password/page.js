import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata = {
  title: 'Reset Password | PETNIC STUDIO',
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
