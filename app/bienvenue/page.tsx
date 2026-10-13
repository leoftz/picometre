import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loading, PageShell } from "@/components/ui";
import { getOnboardingStep, onboardingPath, requireUser } from "@/lib/auth/dal";

// Entry point after sign-in: sends the user to the next step of the sign-up flow.
export default function Welcome() {
  return (
    <PageShell>
      <Suspense fallback={<Loading />}>
        <Route />
      </Suspense>
    </PageShell>
  );
}

async function Route(): Promise<never> {
  await requireUser();
  redirect(onboardingPath(await getOnboardingStep()));
}
