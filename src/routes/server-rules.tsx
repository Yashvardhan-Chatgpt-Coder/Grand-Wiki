import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { Info } from "lucide-react";

export const Route = createFileRoute("/server-rules")({
  head: () => ({
    meta: [{ title: "Server Rules | Grand Wiki" }],
  }),
  component: ServerRulesPage,
});

function ServerRulesPage() {
  return (
    <OrganizerLayout header={<SoftwareHeader title="Server Rules" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0 bg-[#f7f8fb] dark:bg-black">
        <header className="shrink-0 border-b border-[#e7e9f0] dark:border-[#222326] bg-white dark:bg-black px-8 py-6">
          <h1 className="text-[30px] font-semibold text-[#000000] dark:text-white mb-3">Server Rules</h1>
          <p className="text-[13px] text-[#666666] dark:text-[#888991]">
            Official rules are available at{" "}
            <a
              href="https://gta5grand.com/forum/forums/11/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#000000] dark:text-white underline hover:opacity-70"
            >
              Grand RP Forum
            </a>
            . Below are unofficial rules not yet documented.
          </p>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-8">
          <div className="w-full space-y-2.5">
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">01.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Performing actions to intentionally disband an organization or make their term unsuccessful is classified as <span className="font-semibold text-[#000000] dark:text-white">Organization Targeting</span> and results in permanent bans on both accounts, plus a ban from the Grand RP official Discord server.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">02.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Trolling, disrespecting, or mocking Senior Administration leads to permanent bans on both accounts. The same behavior toward the Curator of Project (Lebron Pluxury) or Project Management (Mazhor, Napal, Meow Meow) results in a <span className="font-semibold text-[#000000] dark:text-white">Project Blacklist</span>—a ban from all Grand RP servers and Discord.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">03.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Only one forum account is allowed across all Grand RP servers.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">04.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Players permanently banned on any Grand RP server cannot become administrators on any server.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">05.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Players must be 18 years or older in real life to become administrators.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">06.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Attempting to deceive or lie to administration results in penalties ranging from leader/admin blacklist to permanent ban, depending on severity.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">07.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Targeting or harassing Grand RP media partners results in a permanent ban for <span className="font-semibold text-[#000000] dark:text-white">Media Targeting</span>.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">08.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                POV requests can be submitted for events including Revolver King, Grand Race, and drift competitions.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">09.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Unauthorized advertising using Grand RP's name results in a project blacklist.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">10.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Exploiting bugs related to in-game currency (GR 6.23) typically results in a permanent ban.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">11.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Unrealistic placement of Money Printing Machines (UB MPM) or dishes for hacker attacks typically results in a 7-day ban.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">12.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Insults in Prime chat, non-RP chat, or during OOC events are classified as <span className="font-semibold text-[#000000] dark:text-white">OOC Insults</span> and result in bans.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">13.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Bringing religion, politics, or racism into gameplay results in a ban.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">14.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Finding and sharing personal or real-life information about players is <span className="font-semibold text-[#000000] dark:text-white">Doxxing</span> and results in a permanent ban.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">15.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Players with multiple ban records cannot become leaders or administrators.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">16.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Punishment history reviews check both of a player's accounts.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">17.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Helping players evade bans or bypass server restrictions results in a permanent ban.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">18.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                For GR 6.10 violations, only evidence from official Grand RP Discord servers is accepted. Direct messages and private server evidence are invalid (server-specific policies may vary).
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">19.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Verbal abuse in languages other than the server's native language is treated as an OOC insult.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">20.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Being in Discord servers that distribute cheats, allow real-money trading, or contain admin leaks results in permanent bans on both accounts.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">21.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Clearing your computer before a mandatory PC check results in permanent bans on both accounts.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">22.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Evidence of searches for admin leaks, cheats, or related content in browser history (regardless of relevance to Grand RP) results in permanent bans on both accounts.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">23.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Using the /try command more than twice in a row counts as Fail RP.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">24.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Using commands meant for /try in /me or /do counts as Fail RP.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">25.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Typing entire words or sentences in all capital letters results in a chat mute.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">26.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Taking money or favors to remove forum complaints is <span className="font-semibold text-[#000000] dark:text-white">Bribery</span> and results in a ban.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">27.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Leaking confidential administrator information results in permanent bans on both accounts.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[14px] text-[#2b2f3a] dark:text-white shrink-0 w-[24px]">28.</span>
              <p className="text-[14px] leading-relaxed text-[#2b2f3a] dark:text-white">
                Not giving proper roleplay commands during in-character actions counts as Fail RP (e.g., healing someone without saying "/me patches the wound").
              </p>
            </div>
          </div>
        </main>
      </div>
    </OrganizerLayout>
  );
}
