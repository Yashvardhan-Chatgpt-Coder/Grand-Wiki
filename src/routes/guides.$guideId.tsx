import type { ReactNode } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Mic2,
} from "lucide-react";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";

const GUIDE_DETAILS: Record<
  string,
  {
    title: string;
    image: string;
    summary: string;
    lastUpdated: Date;
    readTime: string;
  }
> = {
  "how-to-process-a-10-15": {
    title: "How To Process A 10-15",
    image: "/Guides/How to arrest a 10-15.png",
    summary: "Complete arrest flow from cuffing the suspect to final DOC processing.",
    lastUpdated: new Date("2026-07-21"), // Set the actual last update date
    readTime: "8 min",
  },
  "10-51-procedure": {
    title: "10-51 Procedure",
    image: "/Guides/10-51 Procedure.png",
    summary: "Standard traffic stop procedure from radar activation to vehicle departure.",
    lastUpdated: new Date("2026-07-21"), // Set the actual last update date
    readTime: "5 min",
  },
};

// Function to calculate relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(diffInDays / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

export const Route = createFileRoute("/guides/$guideId")({
  head: ({ params }) => ({
    meta: [{ title: `${GUIDE_DETAILS[params.guideId]?.title || "Guide"} | Grand Wiki` }],
  }),
  beforeLoad: ({ params }) => {
    if (!GUIDE_DETAILS[params.guideId]) {
      throw notFound();
    }
  },
  component: GuideDetailPage,
});

function GuideDetailPage() {
  const { guideId } = Route.useParams();
  const guide = GUIDE_DETAILS[guideId];

  if (!guide) return null;

  return (
    <OrganizerLayout header={<SoftwareHeader title="Guides" />}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f7f8fb] text-[#000000]">
        <header className="shrink-0 bg-white px-8 py-6">
          <div className="w-full flex flex-col gap-4">
            <Link
              to="/guides"
              className="inline-flex w-fit items-center gap-2 text-[13px] font-medium text-[#666666] transition-colors hover:text-[#000000]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to guides
            </Link>
            <div className="w-full">
              <h1 className="text-[32px] font-bold tracking-tight text-[#000000]">{guide.title}</h1>
              <div className="mt-2 flex items-baseline justify-between gap-4 w-full">
                <p className="text-[14px] text-[#666666] leading-relaxed max-w-[75%]">{guide.summary}</p>
                <div className="flex items-center gap-3 shrink-0">
                  {guideId === "10-51-procedure" && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = document.querySelector('#video-tutorial');
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#FF0000] text-white text-[13px] font-semibold hover:bg-[#CC0000] transition-colors cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      Video Tutorial
                    </button>
                  )}
                  {guideId === "how-to-process-a-10-15" && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = document.querySelector('#video-tutorial');
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#FF0000] text-white text-[13px] font-semibold hover:bg-[#CC0000] transition-colors cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      Video Tutorial
                    </button>
                  )}
                  <span className="text-[12px] font-medium text-[#8a90a0] text-right">
                    Last updated: {getRelativeTime(guide.lastUpdated)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-8 py-10">
          {guideId === "how-to-process-a-10-15" && <HowToProcessA1015Guide />}
          {guideId === "10-51-procedure" && <TrafficStopProcedureGuide />}
        </main>
      </div>
    </OrganizerLayout>
  );
}

// 10-51 Traffic Stop Procedure Guide Component
function TrafficStopProcedureGuide() {
  return (
    <div className="flex gap-8 max-w-[1400px] mx-auto">
      <article className="flex-1 max-w-3xl prose text-[15px] leading-relaxed text-[#374151] space-y-8">
        
        {/* Step 1 */}
        <section id="step-1" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Step 1: Activate Radar</h2>
          <p className="text-[#4b5563]">
            While being inside the vehicle, flex the <KeyChip>J</KeyChip> muscle and press the <strong>"Turn On Radar"</strong> option. This will display the speed and details of the vehicle ahead.
          </p>
        </section>

        {/* Step 2 */}
        <section id="step-2" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Step 2: Issue Stop Notification</h2>
          <p className="text-[#4b5563]">
            If the vehicle is detected speeding, flex <KeyChip>J</KeyChip> again to send a <strong>Stop Notification</strong> and signal the vehicle to pull over. You will give 3 times demands with duration of 5 seconds.
          </p>
          <ul className="mt-3 space-y-1.5 list-disc pl-5 text-[#4b5563]">
            <li>City speed limit: <span className="font-semibold text-black">120 mph</span></li>
            <li>Outside city speed limit: <span className="font-semibold text-black">180 mph</span></li>
          </ul>
        </section>

        {/* Step 3 */}
        <section id="step-3" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Step 3: Vehicle Stop Compliance</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-semibold text-black">If the driver pulls over</h3>
              <p className="mt-1 text-[#4b5563]">
                Once the driver pulls over, instruct them to <strong>turn off the engine</strong> and <strong>exit the vehicle calmly</strong>.
              </p>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">If the driver does not pull over after 3 demands</h3>
              <p className="mt-1 text-[#4b5563]">
                Block the driver's engine and assess the situation:
              </p>
              <ul className="mt-2 space-y-2 list-disc pl-5 text-[#4b5563]">
                <li>
                  <strong className="text-black">If the driver gets out to fight:</strong> Take out your gun and knock him down.
                </li>
                <li>
                  <strong className="text-black">If the driver stays in the vehicle:</strong>
                  <ul className="mt-1.5 space-y-1 list-disc pl-5">
                    <li>If the glass/window is not broken: Quickly break the car's window, then tase him with a stun gun.</li>
                    <li>If the glass is already broken: Directly tase him with a stun gun.</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step 4 */}
        <section id="step-4" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Step 4: Initial Radio Dispatch</h2>
          <p className="text-[#4b5563]">
            Once the driver exits the vehicle, call dispatch:
          </p>
          <div className="mt-2">
            <VoiceLine>Badge Number, show me conducting a 10-51 on a (vehicle color/type). We are Code 4 at (location).</VoiceLine>
          </div>
        </section>

        {/* Step 5 */}
        <section id="step-5" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Step 5: Contact Phase</h2>
          
          <div className="space-y-4">
            <p className="text-[#4b5563]">
              Exit your vehicle and update dispatch:
            </p>
            <div className="mt-2">
              <VoiceLine>We are Code 6 now.</VoiceLine>
            </div>
            <p className="mt-2 text-[#4b5563]">
              Place a <strong>barricade</strong> behind your patrol vehicle to secure the scene.
            </p>
            <p className="mt-2 text-[#4b5563]">
              Approach the driver, explain the reason for the stop, and request their <strong>passport / identification</strong>.
            </p>
          </div>
        </section>

        {/* Step 6 */}
        <section id="step-6" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Step 6: Background Verification</h2>
          
          <div className="space-y-4">
            <p className="text-[#4b5563]">
              Examine the identification, then inform:
            </p>
            <div className="mt-2">
              <VoiceLine>Sir, please wait a moment while I check your background.</VoiceLine>
            </div>
            <p className="mt-2 text-[#4b5563]">
              Conduct a background check while maintaining visual oversight of the driver to ensure safety.
            </p>
          </div>
        </section>

        {/* Step 7 */}
        <section id="step-7" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Step 7: Resolution</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-semibold text-black">7.1 If Background is Clear</h3>
              <div className="mt-2">
                <VoiceLine>Sir, your background is clear. I'm issuing a warning this time. If you are caught speeding again, you may be fined. Please return to your vehicle and proceed safely.</VoiceLine>
              </div>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">7.2 If Violations Are Found</h3>
              <p className="mt-1 text-[#4b5563]">
                If records indicate criminal activity or repeated speeding offenses, issue a <strong>fine / penalty</strong> according to the <Link to="/patrolmans-guide" className="text-[#5863ef] hover:underline font-medium">Patrolman's Guide</Link> and proceed based on department protocol.
              </p>
            </div>
          </div>
        </section>

        {/* Step 8 */}
        <section id="step-8" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Step 8: Closing Dispatch Notification</h2>
          <p className="text-[#4b5563]">
            Once the vehicle departs, call dispatch:
          </p>
          <div className="mt-2">
            <VoiceLine>Badge Number, my last 10-51 is now 10-99. Show me back 10-8 / 19.</VoiceLine>
          </div>
          <p className="mt-2 text-[#4b5563]">
            (If 10-8, provide the current location.)
          </p>
        </section>

        {/* Step 9 */}
        <section id="step-9" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Step 9: Resume Patrol</h2>
          <p className="text-[#4b5563]">
            Remove the barricade and return to regular patrol duties.
          </p>
        </section>

        {/* Warnings & Strict Protocols */}
        <section id="rules" className="space-y-4 pt-4 border-t border-gray-100 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black">
            Warnings & Strict Protocols
          </h2>
          <p className="text-gray-600">
            Follow these critical rules during traffic stop procedures:
          </p>
          
          <ul className="space-y-3 list-disc pl-5">
            <li>
              <strong className="text-black">Three Pullover Demands <span className="text-red-600">(P.C. 4.2.2)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Always give <strong>3 pullover demands</strong> with a duration of 5 seconds between each demand before blocking the engine.</p>
            </li>
            <li>
              <strong className="text-black">No Ramming <span className="text-red-600">(Car Ramming | Jail 120 min)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Do <strong>not</strong> ram anyone to stop their car, even if you cannot block their engine (e.g., engine blocker on cooldown or person has anti-radar fitted). Always follow proper pullover procedure.</p>
            </li>
            <li>
              <strong className="text-black">Realistic Barricade Placement <span className="text-red-600">(Power Gaming | Jail 120 min)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Do <strong>not</strong> place barricades above or below ground level. Barricades must be placed realistically on the road surface.</p>
            </li>
            <li>
              <strong className="text-black">Barricade Safety <span className="text-red-600">(Power Gaming | Jail 120 min)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Do <strong>not</strong> place or remove barricades while holding a firearm.</p>
            </li>
            <li>
              <strong className="text-black">PDA Usage <span className="text-red-600">(Power Gaming | Jail 120 min)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Do <strong>not</strong> open or operate the PDA while holding a firearm.</p>
            </li>
            <li>
              <strong className="text-black">Weapon Discipline</strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Do <strong>not</strong> aim or point your weapon at a driver who is cooperating and not posing a threat.</p>
            </li>
          </ul>
        </section>

        {/* Video Tutorial */}
        <section id="video-tutorial" className="space-y-4 pt-4 border-t border-gray-100 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black">
            Video Tutorial
          </h2>
          <p className="text-gray-600">
            Watch this video demonstration of the 10-51 procedure:
          </p>
          <div className="mt-4 rounded-[12px] overflow-hidden border border-[#e2e5ec] bg-black shadow-lg">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/GtnHXY9q-qw"
                title="Phase 2 10-51 Procedure"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>

      </article>

      {/* Sidebar - Table of Contents */}
      <aside className="hidden lg:block w-[320px] shrink-0 sticky top-0 self-start">
        <div className="rounded-[8px] border border-[#e2e5ec] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[#000000] mb-3 pb-2 border-b border-gray-100">
            Table of Contents
          </h3>
          <nav className="space-y-0.5">
            <IndexLink href="#step-1">Step 1: Activate Radar</IndexLink>
            <IndexLink href="#step-2">Step 2: Issue Stop Notification</IndexLink>
            <IndexLink href="#step-3">Step 3: Vehicle Stop Compliance</IndexLink>
            <IndexLink href="#step-4">Step 4: Initial Radio Dispatch</IndexLink>
            <IndexLink href="#step-5">Step 5: Contact Phase</IndexLink>
            <IndexLink href="#step-6">Step 6: Background Verification</IndexLink>
            <IndexLink href="#step-7">Step 7: Resolution</IndexLink>
            <IndexLink href="#step-8">Step 8: Closing Dispatch Notification</IndexLink>
            <IndexLink href="#step-9">Step 9: Resume Patrol</IndexLink>
            <IndexLink href="#rules">Warnings & Strict Protocols</IndexLink>
          </nav>
        </div>
      </aside>
    </div>
  );
}

// 10-15 Arrest Procedure Guide Component
function HowToProcessA1015Guide() {
  return (
    <div className="flex gap-8 max-w-[1400px] mx-auto">
      <article className="flex-1 max-w-3xl prose text-[15px] leading-relaxed text-[#374151] space-y-8">
        
        {/* Phase 1 */}
        <section id="phase-1" className="space-y-4 scroll-mt-8 section">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Phase 1: Cuffing & Securing</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-semibold text-black">1. Cuff the suspect</h3>
              <p className="mt-1 text-[#4b5563]">
                Put the <KeyChip>G</KeyChip> pointer on the suspect and press <KeyChip>Z</KeyChip> to cuff. 
                If the suspect is unconscious, cuff first and then patch them.
              </p>
              <div className="mt-2">
                <VoiceLine>I am going to cuff you.</VoiceLine>
              </div>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">2. State charges and identify yourself</h3>
              <p className="mt-1 text-[#4b5563]">
                Once cuffed, tell the suspect why they are under arrest and who you are.
              </p>
              <div className="mt-2 space-y-2">
                <VoiceLine>You are being placed under arrest for [reason].</VoiceLine>
                <VoiceLine>I am [your name] from [your organization].</VoiceLine>
              </div>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">3. Drag to the vehicle</h3>
              <p className="mt-1 text-[#4b5563]">
                Press <KeyChip>X</KeyChip> to drag. You can only drag after cuffing the suspect.
              </p>
              <div className="mt-2">
                <VoiceLine>I am going to drag you by your arm.</VoiceLine>
              </div>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">4. Place them in the vehicle</h3>
              <p className="mt-1 text-[#4b5563]">
                Release the drag, stand on the correct seat side, then press <KeyChip>C</KeyChip> to put the suspect in the vehicle.
              </p>
              <div className="mt-2 space-y-2">
                <VoiceLine>I am going to release you by your arm.</VoiceLine>
                <VoiceLine>I am going to put you inside the vehicle. Please watch your head.</VoiceLine>
              </div>
            </div>
          </div>
        </section>

        {/* Phase 2 */}
        <section id="phase-2" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Phase 2: Transport & Miranda Rights</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-semibold text-black">1. Drive to DOC</h3>
              <p className="mt-1 text-[#4b5563]">
                Drive cleanly and follow traffic laws unless there is an active threat trying to stop you or save the 10-15.
              </p>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-[#4b5563]">
                <li>City speed limit: <span className="font-semibold text-black">120 mph</span></li>
                <li>Highway speed limit: <span className="font-semibold text-black">180 mph</span></li>
                <li>Overspeed only during a real threat</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">2. Read Miranda rights</h3>
              <p className="mt-1 text-[#4b5563]">
                Read the Miranda rights while transporting the 10-15. If they do not respond, repeat it up to 3 times.
              </p>
              <div className="mt-2 space-y-2">
                <VoiceLine>
                  You have the right to remain silent. Anything you say can and will be used against you in a court of law. You have the right to an attorney. If you cannot afford an attorney, one will be provided for you. Do you understand the rights I have just read to you?
                </VoiceLine>
                <VoiceLine>Taking your silence as a yes.</VoiceLine>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-[14px] font-semibold text-black mb-2">During Martial Law:</p>
                <div className="mt-2 space-y-2">
                  <VoiceLine>
                    You have the right to remain silent. The State is currently under Martial Law. There is no bail, attorney, lawyer, or other legal services available at this time. Do you understand the rights I have just read to you?
                  </VoiceLine>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Phase 3 */}
        <section id="phase-3" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Phase 3: Legal & Medical Requests</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-semibold text-black">1. If they ask for a lawyer</h3>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-[#4b5563]">
                <li>Do a department radio to DOJ and ask if a lawyer is available.</li>
                <li>If DOJ says a lawyer is available, wait for the lawyer.</li>
                <li>If no lawyer is available, continue the normal arrest process.</li>
                <li>Do not confiscate illegal items while the lawyer request is still pending.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">2. Private lawyer request</h3>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-[#4b5563]">
                <li>Ask the 10-15 for the lawyer's name.</li>
                <li>Search the name in PDA, check licenses, and take the phone number.</li>
                <li>Ask DOJ if the person is a bar certified lawyer.</li>
                <li>If DOJ confirms, call or message the lawyer. If not available, tell the 10-15.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">3. If medical help is requested</h3>
              <p className="mt-1 text-[#4b5563]">
                Do a department radio to EMS and request medical assistance at DOC. If EMS does not reply, try to provide medical assistance yourself.
              </p>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">4. When the lawyer arrives</h3>
              <p className="mt-1 text-[#4b5563]">
                Stop the bodycam, save it to an SD card, hand it to the lawyer, then join the Government Discord voice channel and show your bodycam.
              </p>
              <div className="mt-2.5">
                <CommandLine>/me Stops recording.</CommandLine>
                <CommandLine>/me Uploads the bodycam footage in a SD Card.</CommandLine>
                <CommandLine>/me Hands over the SD card to [lawyer's name].</CommandLine>
              </div>
            </div>
          </div>
        </section>

        {/* Phase 4 */}
        <section id="phase-4" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Phase 4: DOC Processing & Identification</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-semibold text-black">1. Jumpsuit and cell entry</h3>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-[#4b5563]">
                <li>Take the 10-15 to DOC reception.</li>
                <li>Ask for their jumpsuit size.</li>
                <li>If they do not know or do not answer, use a freesize jumpsuit.</li>
                <li>Stop dragging before picking up the jumpsuit.</li>
                <li>Take them inside the cell, release dragging, search them, and confiscate items.</li>
              </ul>
              <div className="mt-2.5">
                <CommandLine>/me Picks Up A Freesize Jumpsuit.</CommandLine>
              </div>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">2. Passport and mask check</h3>
              <p className="mt-1 text-[#4b5563]">
                If you have not seen the passport, uncuff the suspect and give them at least 5 seconds to remove their mask and show the passport.
              </p>
              <div className="mt-2">
                <VoiceLine>
                  I am going to uncuff you, after that you will have 5 seconds to remove your mask and show me your passport.
                </VoiceLine>
              </div>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">3. If they do not comply</h3>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-[#4b5563]">
                <li>Cuff them again.</li>
                <li>Put them on the floor.</li>
                <li>Check their health before removing the mask.</li>
                <li>Use <KeyChip>G</KeyChip> pointer &gt; Organization &gt; Tear off mask.</li>
                <li>Use <KeyChip>G</KeyChip> pointer &gt; Organization &gt; Find out personal identification.</li>
              </ul>
              <div className="mt-2 space-y-2">
                <VoiceLine>I am going to tear off your mask.</VoiceLine>
                <VoiceLine>I am going to check your back pockets for identification.</VoiceLine>
              </div>
            </div>
          </div>
        </section>

        {/* Phase 5 */}
        <section id="phase-5" className="space-y-4 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black border-b border-gray-100 pb-2">Phase 5: Charges & Imprisonment</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-semibold text-black">1. Check PDA and organization</h3>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-[#4b5563]">
                <li>Search the suspect in PDA and check their organization before final processing.</li>
                <li>If they are from a legal organization, do not process a normal arrest.</li>
                <li>Department DOJ and take the state employee to the Capitol for further proceedings.</li>
                <li>If you are not High Command, ask High Command to do the department radio.</li>
                <li>If they are not from a legal organization, continue normally.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">2. Apply charges</h3>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-[#4b5563]">
                <li>Give fines based on charges.</li>
                <li>Add wanted level based on charges.</li>
                <li>Revoke licenses only when allowed.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">3. Put them behind bars</h3>
              <p className="mt-1 text-[#4b5563]">
                Place the jumpsuit, say the final line, then use <KeyChip>G</KeyChip> pointer &gt; Organization &gt; Arrest.
              </p>
              <div className="mt-2.5 space-y-2">
                <CommandLine>/me Places A Freesize Jumsuit.</CommandLine>
                <VoiceLine>I am going to put you behind the bars.</VoiceLine>
              </div>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-black">4. Optional phone and radio</h3>
              <p className="mt-1 text-[#4b5563]">
                You may try to take the phone and radio after completing the arrest flow.
              </p>
              <div className="mt-2.5">
                <CommandLine>/try Takes cell phone and radio out.</CommandLine>
              </div>
            </div>
          </div>
        </section>

        {/* Tips & Tricks */}
        <section id="tips-tricks" className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-5 space-y-4 scroll-mt-8">
          <h3 className="text-[16px] font-semibold text-black">Tips & Tricks</h3>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-[14px] font-semibold text-black mb-2">Scene Control</h4>
              <p className="text-[13.5px] leading-relaxed text-[#4b5563]">
                If the situation is active and the 10-15 may run away, put them on the floor using <KeyChip>G</KeyChip> pointer &gt; Organization &gt; Put on floor.
              </p>
              <div className="space-y-2 mt-2">
                <VoiceLine>I am going to put you on the floor.</VoiceLine>
                <VoiceLine>I am going to make you stand now.</VoiceLine>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <h4 className="text-[14px] font-semibold text-black mb-2">Department Radio Calls</h4>
              <p className="text-[13.5px] leading-relaxed text-[#4b5563]">
                For all department radio calls during arrest procedures, you can directly copy paste them from <Link to="/department-radio" className="text-[#5863ef] hover:underline font-medium">Department Radio</Link>.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <h4 className="text-[14px] font-semibold text-black mb-2">In-Game Commands</h4>
              <p className="text-[13.5px] leading-relaxed text-[#4b5563]">
                For all in-game commands during arrest procedure, you can directly copy paste them from <Link to="/arrest-procedure" className="text-[#5863ef] hover:underline font-medium">Arrest Procedure</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Warnings and Strict Protocols Section */}
        <section id="warnings" className="space-y-4 pt-4 border-t border-gray-100 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black">
            Warnings & Strict Protocols
          </h2>
          <p className="text-gray-600">
            Avoid these critical mistakes during the arrest flow. Violations of these rules can result in IC or OOC punishments:
          </p>
          
          <ul className="space-y-3 list-disc pl-5">
            <li>
              <strong className="text-black">No Cuffing While Running <span className="text-red-600">(Power Gaming | Jail 120 min)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">You must be standing or walking. Running cuff is not allowed.</p>
            </li>
            <li>
              <strong className="text-black">No Cuffing an Armed Suspect <span className="text-red-600">(Power Gaming | Jail 120 min)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Do not cuff someone while they have a gun in hand.</p>
            </li>
            <li>
              <strong className="text-black">No Running/Jumping While Dragging <span className="text-red-600">(Power Gaming | Jail 120 min)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Only walk while dragging a cuffed suspect. Do not run or jump.</p>
            </li>
            <li>
              <strong className="text-black">Use Correct Vehicle Side <span className="text-red-600">(Power Gaming | Jail 120 min)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Stand on the same side as the seat you are placing the 10-15 into. Do not stand on the driver side and place them into the opposite passenger seat.</p>
            </li>
            <li>
              <strong className="text-black">Do Not Tear Mask if Critically Injured <span className="text-red-600">(SR 5.8 | Jail 300 min)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Never tear the mask off a critically injured 10-15. Check their health first before forcing mask removal.</p>
            </li>
            <li>
              <strong className="text-black">Do Not Rush Confiscation <span className="text-red-600">(P.C. 4.2.2)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">If the suspect asks for a lawyer, handle the lawyer request first. Do not confiscate illegal items while the lawyer request is still pending.</p>
            </li>
            <li>
              <strong className="text-black">Lawyer Waiting Time</strong>
              <p className="text-[14px] text-[#4b5563] mt-1">If the 10-15 requests a lawyer, you must wait for 15 minutes. If the lawyer does not arrive within 15 minutes, you may proceed with processing the 10-15 normally.</p>
            </li>
            <li>
              <strong className="text-black">Lawyer Decisions</strong>
              <p className="text-[14px] text-[#4b5563] mt-1">The lawyer can suggest releasing the 10-15 if they see violations. However, the final decision is yours.</p>
            </li>
            <li>
              <strong className="text-black">Command Limitations <span className="text-red-600">(GR 6.1 | Warn)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Do not use the <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-[12px]">/try Takes cell phone and radio out</code> command more than 2 times.</p>
            </li>

            <li>
              <strong className="text-black">Arrest Time Limit <span className="text-red-600">(SR 1.14 | Jail 120 min)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">After cuffing a suspect, you must complete the arrest within 25 minutes. This time may be extended if the 10-15 requests a lawyer or medical assistance (EMS).</p>
            </li>
            <li>
              <strong className="text-black">License Revocation Authority <span className="text-red-600">(P.C. 4.2.2)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">If you are not High Command, you must obtain permission from High Command or DOJ before revoking a 10-15's license.</p>
            </li>
            <li>
              <strong className="text-black">Department Radio Authority</strong>
              <p className="text-[14px] text-[#4b5563] mt-1">If you are not High Command, contact your High Command to make department radio announcements on your behalf.</p>
            </li>
            <li>
              <strong className="text-black">ID Disclosure Requirement <span className="text-red-600">(GR 6.4 | Warn)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Never deny showing your ID to anybody under any circumstances unless you have an approved corrupt biography with that specific outcome.</p>
            </li>
            <li>
              <strong className="text-black">Bodycam Recording Mandatory <span className="text-red-600">(Leave the 10-15/P.C. 4.2.2/Internal Action)</span></strong>
              <p className="text-[14px] text-[#4b5563] mt-1">Your bodycam must be recording before you engage with a 10-15. This protects both you and the suspect during the entire interaction.</p>
            </li>
          </ul>
        </section>

        {/* Video Tutorial */}
        <section id="video-tutorial" className="space-y-4 pt-4 border-t border-gray-100 scroll-mt-8">
          <h2 className="text-[22px] font-bold text-black">
            Video Tutorial
          </h2>
          <p className="text-gray-600">
            Watch these video demonstrations of the 10-15 arrest procedure:
          </p>
          
          {/* Phase 1 Video */}
          <div className="mt-4 space-y-2">
            <h3 className="text-[17px] font-semibold text-black">Introduction To LSPD</h3>
            <div className="rounded-[12px] overflow-hidden border border-[#e2e5ec] bg-black shadow-lg">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/pAdu6QgpfG8"
                  title="Phase 1 training video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          {/* Full Procedure Video */}
          <div className="mt-6 space-y-2">
            <h3 className="text-[17px] font-semibold text-black">Complete 10-15 Procedure</h3>
            <div className="rounded-[12px] overflow-hidden border border-[#e2e5ec] bg-black shadow-lg">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/z7aqlXcJh6o"
                  title="10-15 Procedure"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

      </article>

      {/* Sidebar - Table of Contents */}
      <aside className="hidden lg:block w-[320px] shrink-0 sticky top-0 self-start">
        <div className="rounded-[8px] border border-[#e2e5ec] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[#000000] mb-3 pb-2 border-b border-gray-100">
            Table of Contents
          </h3>
          <nav className="space-y-0.5">
            <IndexLink href="#phase-1">Phase 1: Cuffing & Securing</IndexLink>
            <IndexLink href="#phase-2">Phase 2: Transport & Miranda Rights</IndexLink>
            <IndexLink href="#phase-3">Phase 3: Legal & Medical Requests</IndexLink>
            <IndexLink href="#phase-4">Phase 4: DOC Processing & Identification</IndexLink>
            <IndexLink href="#phase-5">Phase 5: Charges & Imprisonment</IndexLink>
            <IndexLink href="#tips-tricks">Tips & Tricks</IndexLink>
            <IndexLink href="#warnings">Warnings & Strict Protocols</IndexLink>
          </nav>
        </div>
      </aside>
    </div>
  );
}

// Utility Components
function VoiceLine({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[8px] border-l-[3px] border-l-[#2563eb] bg-[#eff6ff] px-3 py-2 text-[13px] font-medium leading-6 text-[#1e40af] w-fit max-w-full">
      <Mic2 className="mr-2 inline h-4 w-4 shrink-0" />
      "{children}"
    </div>
  );
}

function CommandLine({ children }: { children: ReactNode }) {
  return (
    <pre className="my-2.5 overflow-x-auto rounded-[6px] border border-[#e2e8f0] bg-[#0f1115] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-[#e2e8f0] shadow-sm w-full max-w-full">
      <code>{children}</code>
    </pre>
  );
}

function KeyChip({ children }: { children: ReactNode }) {
  return (
    <kbd className="mx-1 inline-flex h-6 min-w-[24px] items-center justify-center rounded-[5px] border border-[#cbd5e1] bg-white px-1.5 font-mono text-[11.5px] font-bold text-[#0f172a] shadow-[2.5px_2.5px_0_#000000] select-none">
      {children}
    </kbd>
  );
}

function IndexLink({ href, children }: { href: string; children: ReactNode }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="block py-2 px-2.5 text-[12.5px] text-[#666666] hover:text-[#000000] hover:underline transition-colors font-medium"
    >
      {children}
    </a>
  );
}
