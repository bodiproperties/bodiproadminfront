"use client";

import { useIdleLogout } from "@/hooks/useIdleLogout";
import IdleWarningDialog from "./IdleWarningDialog";

export default function IdleLogoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showWarning, secondsLeft, stayActive, logoutNow } = useIdleLogout();

  return (
    <>
      {children}
      <IdleWarningDialog
        open={showWarning}
        secondsLeft={secondsLeft}
        onStay={stayActive}
        onLogout={logoutNow}
      />
    </>
  );
}