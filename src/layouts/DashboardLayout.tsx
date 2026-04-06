"use client";

import "../app/globals.css";
import { useOidcUser } from "@axa-fr/react-oidc";
import Button from "@components/Button";
import { Input } from "@components/Input";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import { notify } from "@components/Notification";
import Paragraph from "@components/Paragraph";
import { useApiCall } from "@utils/api";
import { UserAvatar } from "@components/ui/UserAvatar";
import { cn } from "@utils/helpers";
import { isNetBirdHosted } from "@utils/netbird";
import { useIsSm, useIsXs } from "@utils/responsive";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, ShieldCheck, XIcon } from "lucide-react";
import React, { useState } from "react";
import AnnouncementProvider, {
  useAnnouncement,
} from "@/contexts/AnnouncementProvider";
import ApplicationProvider, {
  useApplicationContext,
} from "@/contexts/ApplicationProvider";
import CountryProvider from "@/contexts/CountryProvider";
import GroupsProvider from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import UsersProvider, { useLoggedInUser } from "@/contexts/UsersProvider";
import Navigation from "@/layouts/Navigation";
import { ChangePasswordForm } from "@/modules/users/ChangePasswordModal";
import { OnboardingProvider } from "@/modules/onboarding/OnboardingProvider";
import Header, { headerHeight } from "./Header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ApplicationProvider>
      <UsersProvider>
        <AnnouncementProvider>
          <GroupsProvider>
            <CountryProvider>
              {!isNetBirdHosted() && <OnboardingProvider />}
              <ForcePasswordChangeGuard>
                <MFAVerificationGuard>
                  <DashboardPageContent>{children}</DashboardPageContent>
                </MFAVerificationGuard>
              </ForcePasswordChangeGuard>
            </CountryProvider>
          </GroupsProvider>
        </AnnouncementProvider>
      </UsersProvider>
    </ApplicationProvider>
  );
}

function ForcePasswordChangeGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { loggedInUser } = useLoggedInUser();

  if (!loggedInUser?.force_password_change) {
    return <>{children}</>;
  }

  const handleSuccess = () => {
    window.location.reload();
  };

  return (
    <>
      {children}
      <Modal open={true} onOpenChange={() => {}}>
        <ChangePasswordForm
          userId={loggedInUser.id}
          email={loggedInUser.email}
          onSuccess={handleSuccess}
          title="Password Change Required"
          description="Your administrator requires you to change your password before continuing."
          showClose={false}
          preventDismiss={true}
        />
      </Modal>
    </>
  );
}

function MFAVerificationGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { loggedInUser } = useLoggedInUser();
  const [code, setCode] = useState("");
  const verifyRequest = useApiCall<{ verified: boolean }>(
    `/users/${loggedInUser?.id}/mfa/verify`,
  );

  if (!loggedInUser?.mfa_required) {
    return <>{children}</>;
  }

  const handleVerify = async () => {
    notify({
      title: "MFA Verification",
      description: "Verifying...",
      promise: verifyRequest.post({ code }).then(() => {
        window.location.reload();
      }),
      loadingMessage: "Verifying code...",
    });
  };

  return (
    <>
      {children}
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent
          maxWidthClass={"max-w-md"}
          showClose={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className={"flex flex-col items-center justify-center px-8 pt-6"}>
            <div className="w-12 h-12 rounded-full bg-nb-gray-900 flex items-center justify-center mb-4">
              <ShieldCheck size={24} className={"text-netbird"} />
            </div>
            <h2 className={"text-lg my-0 text-center"}>
              Two-Factor Authentication
            </h2>
            <Paragraph className={"text-sm text-center max-w-xs mt-2"}>
              Enter the 6-digit code from your authenticator app to continue.
            </Paragraph>
          </div>
          <div className={"px-8 py-4 flex flex-col gap-4"}>
            <Input
              type={"text"}
              customPrefix={
                <KeyRound size={16} className={"text-nb-gray-300"} />
              }
              placeholder={"Enter 6-digit code"}
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length === 6) handleVerify();
              }}
              autoFocus
            />
          </div>
          <ModalFooter className={"items-center"}>
            <Button
              variant={"primary"}
              className={"w-full"}
              disabled={code.length !== 6}
              onClick={handleVerify}
            >
              <ShieldCheck size={14} />
              Verify
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function DashboardPageContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { oidcUser: user } = useOidcUser();
  const { mobileNavOpen, toggleMobileNav } = useApplicationContext();
  const isSm = useIsSm();
  const isXs = useIsXs();
  const { isRestricted } = usePermissions();

  const navOpenPageWidth = isSm ? "45%" : isXs ? "60%" : "80%";
  const { bannerHeight } = useAnnouncement();
  return (
    <div className={cn("flex flex-col h-screen", mobileNavOpen && "flex")}>
      {mobileNavOpen && (
        <motion.div
          className={"h-screen bg-nb-gray-950 w-11/12 max-w-[22rem]"}
          layout={true}
          transition={{
            type: "spring",
            stiffness: 100,
            bounce: 0.8,
            damping: 10,
            mass: 0.4,
          }}
          animate={{
            x: 0,
          }}
          initial={{
            x: -200,
          }}
        >
          <div
            className={
              "flex items-center justify-between gap-3 pl-4 pr-8 pt-8 pb-3 w-11/12"
            }
          >
            <div className={"flex items-center gap-3 max-w-[22rem]"}>
              <UserAvatar size={"small"} />
              <div className="flex flex-col space-y-1">
                <p className="font-medium leading-none dark:text-gray-300">
                  {user?.name}
                </p>
                <p className="text-xs leading-none dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              className={"!px-3"}
              variant={"default-outline"}
              size={"xs"}
              onClick={toggleMobileNav}
            >
              <div>
                <XIcon size={16} className={"relative"} />
              </div>
            </Button>
          </div>
          <Navigation fullWidth />
        </motion.div>
      )}
      <AnimatePresence mode={"wait"}>
        <motion.div
          layout={"position"}
          className={cn(
            mobileNavOpen
              ? "border border-nb-gray-900 shadow-inner overflow-hidden rounded-xl fixed scale-75"
              : "",
          )}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 25,
            duration: 0.45,
            mass: 0.1,
          }}
          animate={{
            x: mobileNavOpen ? navOpenPageWidth : 0,
            width: "100%",
            height: mobileNavOpen ? "90vh" : "auto",
            y: mobileNavOpen ? "6.5%" : 0,
          }}
        >
          {mobileNavOpen && (
            <motion.div
              onClick={toggleMobileNav}
              className={
                "absolute w-full h-full bg-black z-[999] transition-all opacity-0"
              }
              animate={{
                opacity: 0.2,
              }}
            ></motion.div>
          )}
          <motion.div
            layout={"position"}
            className={"relative"}
            animate={{
              scale: mobileNavOpen ? 0.75 : 1,
              height: mobileNavOpen ? "90vh" : "auto",
              originX: 0,
              originY: 0,
            }}
            transition={{
              type: "spring",
              duration: 0.45,
              stiffness: 500,
              damping: 25,
              mass: 0.1,
            }}
          >
            <Header />
            <div
              className={"flex flex-row flex-grow"}
              style={{
                height: `calc(100vh - ${headerHeight + bannerHeight}px)`,
              }}
            >
              {!isRestricted && <Navigation hideOnMobile />}
              {children}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
