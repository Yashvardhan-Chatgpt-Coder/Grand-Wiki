import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [{ title: "Events | Grand Wiki" }],
  }),
  component: EventsPage,
});

interface EventItem {
  title: string;
  image: string;
  participants: string;
  timing: string;
  duration: string;
  overview: string;
  pov: string;
  important: string;
}

const EVENTS: EventItem[] = [
  {
    title: "Airdrop",
    image: "/Events/Airdrop.png",
    participants: "Everyone",
    timing: "Every 2 hours 20 mins",
    duration: "No duration",
    overview: "A military supply crate drops from the sky in a randomized designated zone. Capture and hold the perimeter against all competing organizations to claim rare military-grade weapons, ammo, and cash.",
    pov: "You need to keep POV for 48 hours. (Only On EN #1)",
    important: "Teaming between different families or gangs inside the zone is strictly prohibited. All players outside your own org are hostile."
  },
  {
    title: "ATM Robbery",
    image: "/Events/ATM Robbery.png",
    participants: "Everyone (Except Lifeinvader & EMS)",
    timing: "all time",
    duration: "",
    overview: "Hack and rob local ATMs across the city to secure quick cash. Initiating a hack triggers a silent alarm, broadcasting your coordinates to all active police patrols.",
    pov: "",
    important: "You cannot rob an ATM while being actively chased by law enforcement. The hack must be initiated beforehand."
  },
  {
    title: "Bank Robbery",
    image: "/Events/Bank Robbery.png",
    participants: "Families & LEOs",
    timing: "MON,WED,SAT at 21:30",
    duration: "",
    overview: "A massive, high-stakes coordinated raid on the central bank vault. Attackers must coordinate drilling, hacking, and hostage negotiations while defenders seal the perimeters.",
    pov: "You need to keep POV for 48 hours.",
    important: "Hostages cannot be killed if law enforcement complies with all reasonable demands. Maximum of 3 demands permitted."
  },
  {
    title: "Battle Of Docks",
    image: "/Events/Battle Of Docks.png",
    participants: "Families",
    timing: "at 10 mins of every 3 hour",
    duration: "",
    overview: "A tactical faction warfare event located at the industrial shipping harbor. Compete to capture and hold secure high-value logistics cargo crates.",
    pov: "You need to keep POV for 48 hours.",
    important: "Entering the event zone after the active combat phase has already commenced (late entry) is against server rules."
  },
  {
    title: "Battleship",
    image: "/Events/Battleship.png",
    participants: "Gangs",
    timing: "18:15",
    duration: "",
    overview: "A strategic maritime event staged aboard an anchored naval warship. Teams battle through narrow decks and ladders to control critical weapon blueprints and ammunition crates.",
    pov: "You need to keep POV for 48 hours.",
    important: "All participants must wear their official organization/family outfits to prevent accidental friendly fire and identify factions."
  },
  {
    title: "Bounty Hunter",
    image: "/Events/Bounty Hunter.png",
    participants: "Everyone (Except State Organizations)",
    timing: "all time",
    duration: "No duration",
    overview: "Track down high-value targets with active state warrants. Hunters use tracking devices to locate fugitives while targets attempt to survive or outrun mercenaries.",
    pov: "You need to keep POV for 48 hours.",
    important: "Bounties cannot be claimed inside green zones (safe zones). Targets must be engaged in public or lawless areas only."
  },
  {
    title: "Clandestine Shop",
    image: "/Events/Clandestine Shop.png",
    participants: "Gangs",
    timing: "every 2 hours",
    duration: "22 mins",
    overview: "An exclusive black-market dealer appears at an undisclosed, hidden location. Players race to find the dealer and buy extremely rare illegal weapons, special equipment, and blueprints.",
    pov: "You need to keep POV for 48 hours.",
    important: "Killing other players inside the immediate circle of the Clandestine Shop NPC is strictly prohibited (Safe Zone rules apply)."
  },
  {
    title: "Data Breach",
    image: "/Events/Data Breach.png",
    participants: "",
    timing: "",
    duration: "",
    overview: "Infiltrate secure cyber databases to extract encrypted state intelligence files. Hackers must defend terminal links while law enforcement coordinates to patch firewalls and trace pings.",
    pov: "",
    important: "You must defend the mainframe terminal until the decryption process reaches 100%. Leaving the room cancels progress."
  },
  {
    title: "Drug Laboratory",
    image: "/Events/Drug Laboratory.png",
    participants: "",
    timing: "",
    duration: "",
    overview: "Seize and hold a concealed chemical facility to manufacture high-yield illicit substances. Requires continuous territorial defense from rival cartels seeking to hijack the product.",
    pov: "",
    important: "Only official gang members are permitted to enter and secure the laboratory. Families and civilians cannot participate."
  },
  {
    title: "Encashment",
    image: "/Events/Encashment.png",
    participants: "",
    timing: "",
    duration: "",
    overview: "A heavily guarded armored transit van transports bank funds across state highways. Law enforcement must escort the convoy to its destination while outlaws coordinate blocks to hijack the van.",
    pov: "",
    important: "Rammed blocking vehicles must be heavy SUVs. Light sports cars cannot be used to ram or stop the armored transit van."
  },
  {
    title: "Family Raid",
    image: "/Events/Family Raid.png",
    participants: "Families",
    timing: "all time",
    duration: "15 mins",
    overview: "A direct turf and estate assault launched against a rival family's headquarters. Attackers breach estate boundaries to steal points, resources, and establish dominance.",
    pov: "You need to keep POV for 48 hours.",
    important: "Defenders cannot spawn or invite players outside their official family registry list to assist in the defense once the raid begins."
  },
  {
    title: "Gang Raid",
    image: "/Events/Gang Raid.png",
    participants: "Gangs",
    timing: "19:00 - 00:00",
    duration: "15 mins",
    overview: "A massive, legal tactical assault authorized to clear out active gang headquarters. Law enforcement clears rooms to seize stockpiled contraband and suppress syndicate influence.",
    pov: "You need to keep POV for 48 hours.",
    important: "State officers must declare a formal warrant broadcast on megaphone and radio before breaching gang headquarters gates."
  },
  {
    title: "Gun Store Robbery",
    image: "/Events/Gun Store Robbery.png",
    participants: "",
    timing: "",
    duration: "",
    overview: "Heavily armed crews break into local ammunition depots to loot valuable weaponry, advanced armor, and military supplies while holding off responding patrols.",
    pov: "",
    important: "A minimum of one active hostage is required to negotiate a getaway. Blind firing from behind shop counters is banned."
  },
  {
    title: "Juice Shop Robbery",
    image: "/Events/Juice Shop Robbery.png",
    participants: "Everyone (Except Lifeinvader & EMS)",
    timing: "all time (not more than 1 time)",
    duration: "",
    overview: "A fast-paced local robbery. Hold shop workers hostage to negotiate escape terms and bag immediate register cash before surrounding officers coordinate a breach.",
    pov: "",
    important: "No heavy weapons are allowed to be used by the robbers during this minor robbery. Pistols and SMGs only."
  },
  {
    title: "King Of The Hill",
    image: "/Events/King Of The Hill.png",
    participants: "Everyone",
    timing: "10 min of every hour",
    duration: "No duration",
    overview: "An intense battle of endurance and positioning. Factions compete to claim and hold a central coordinate flag while under constant, multi-directional heavy weapon fire.",
    pov: "You need to keep POV for 48 hours.",
    important: "Using armored luxury vehicles to block the hill flag coordinate or ramming players inside the zone is against guidelines."
  },
  {
    title: "Mega Mall",
    image: "/Events/Mega Mall.png",
    participants: "Everyone",
    timing: "every 4 mins",
    duration: "No duration",
    overview: "A massive, multi-level siege of the state shopping mall. Criminals attempt to crack retail vaults and secure loot bags while state tactical units establish rooftop and perimeter blockades.",
    pov: "You need to keep POV for 48 hours. (Only On EN #1)",
    important: "Rooftop camping before the official start timer of the mall robbery is strictly against event rules."
  },
  {
    title: "Military Base Robbery",
    image: "/Events/Military Base Robbery.png",
    participants: "Gangs and LEOs",
    timing: "12:00 - 22:00",
    duration: "",
    overview: "A daring, coordinated raid on Fort Zancudo's secure underground ammunition reserves. Crews must breach heavy automated gates, hack control pads, and fight off military defense forces.",
    pov: "You need to keep POV for 48 hours.",
    important: "It is mandatory for all thieves to exit the military base through the main highway gates. Air escapes are forbidden."
  },
  {
    title: "RP Ticket Factory",
    image: "/Events/RP Ticket Factory.png",
    participants: "Families",
    timing: "10:30, 16:30, 22:30",
    duration: "",
    overview: "Seize control of the state ticket printing facility. Controlling the primary printing presses allows players to produce highly valuable exchange tickets and specialized permits.",
    pov: "You need to keep POV for 48 hours.",
    important: "Weapon use is restricted to self-defense inside the ticket processing plant. Blind firing down the stairs is prohibited."
  },
  {
    title: "Store Robbery",
    image: "/Events/Store Robbery.png",
    participants: "Everyone except EMS",
    timing: "all time",
    duration: "15 mins",
    overview: "Rob local 24/7 convenience store registers to secure quick cash. An essential starting point for training rookie law enforcement responders and street outlaws.",
    pov: "You need to keep POV for 48 hours.",
    important: "A maximum of two law enforcement patrol cars are permitted to respond to a standard 24/7 store alarm."
  },
  {
    title: "Transport Escort",
    image: "/Events/Transport Escort.png",
    participants: "",
    timing: "sunday at 22:00",
    duration: "",
    overview: "Secure and escort heavily guarded military transport convoys carrying sensitive experimental weapons or files across the state, resisting ambushes from rival syndicates.",
    pov: "",
    important: "The transport truck cannot be pushed off-road or into water. Outlaws must intercept the convoy on paved highways."
  },
  {
    title: "Vehicle Theft",
    image: "/Events/Vehicle Theft.png",
    participants: "Everyone (Except EMS)",
    timing: "all the time",
    duration: "20 Mins",
    overview: "Locate, lockpick, and hotwire designated high-end luxury vehicles and deliver them to export docks while trying to evade active police tracker pings.",
    pov: "",
    important: "The stolen vehicle cannot be parked or hidden inside private family garages or green zones to evade active tracking pings."
  }
];

function EventsPage() {
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);

  // Keep activeEvent populated during the exit transition so that the layout has content to animate out
  if (selectedEvent && selectedEvent !== activeEvent) {
    setActiveEvent(selectedEvent);
  }

  const filteredEvents = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return EVENTS;
    return EVENTS.filter((event) => event.title.toLowerCase().includes(q));
  }, [search]);

  return (
    <OrganizerLayout header={<SoftwareHeader title="Events" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <main className="relative min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-6">
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-[20px] font-semibold text-[#000000] dark:text-white tracking-tight">
                Server Events
              </h2>
              <p className="text-[13px] text-[#666666] dark:text-[#9aa1b0]">
                Explore all active server events and activities.
              </p>
            </div>

            <div className="max-w-sm">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a90a0]" />
                <input
                  type="text"
                  data-no-style
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events..."
                  className="h-8 w-full rounded-[10px] border border-[#e2e5ec] bg-white dark:border-[#2a2d3d] dark:bg-[#1a1d26] pl-11 pr-11 text-[13px] text-[#000000] dark:text-white outline-none placeholder:text-[#9aa1b0] focus:border-[#000000] dark:focus:border-[#4a4f63]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a90a0] hover:text-[#000000] dark:hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </label>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-[#d8dde6] dark:border-[#2a2d3d] bg-white dark:bg-[#1a1d26] px-6 py-10 text-center">
                <p className="text-[15px] font-semibold text-[#000000] dark:text-white">No events found</p>
                <p className="mt-2 text-[13px] text-[#8a90a0]">Try a different search term.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredEvents.map((event, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedEvent(event)}
                    className="group relative aspect-[4/5] overflow-hidden rounded-[8px] border border-[#e2e5ec] dark:border-[#2a2d3d] cursor-pointer transition-all duration-300"
                  >

                    <img
                      src={event.image}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                    {/* White overlay on hover */}
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                    
                    {/* Black gradient vignette at bottom */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0c0d12]/95 via-[#0c0d12]/60 to-transparent p-4 pt-12">
                      <h3 className="text-[14px] font-bold text-white tracking-tight leading-tight">
                        {event.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Pop Window Modal - Styled exactly with Dialog animations and attributes from Settings window */}
      <Dialog open={selectedEvent !== null} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
        <DialogContent
          overlayClassName="z-[100]"
          className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[100] flex h-[90vh] md:h-[580px] w-[calc(100%-32px)] max-w-4xl flex-col md:flex-row gap-0 overflow-hidden rounded-[16px] border border-[#e2e5ec] dark:border-[#2a2d3d] bg-white dark:bg-[#1a1d26] p-0 shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
          hideCloseButton
        >
          <DialogTitle className="sr-only">
            {activeEvent ? activeEvent.title : "Event Details"}
          </DialogTitle>
          
          {activeEvent && (
            <>
              {/* Left Half: Image */}
              <div className="w-full md:w-1/2 h-[220px] md:h-auto md:self-stretch relative overflow-hidden bg-black shrink-0">
                <img
                  src={activeEvent.image}
                  alt={activeEvent.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Visual gradient overlay for mobile */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden" />
                <div className="absolute bottom-4 left-4 md:hidden">
                  <h2 className="text-[20px] font-bold text-white tracking-tight leading-tight">
                    {activeEvent.title}
                  </h2>
                </div>
              </div>

              {/* Right Half: Content */}
              <div className="w-full md:w-1/2 h-[calc(100%-220px)] md:h-full flex flex-col min-h-0 bg-white dark:bg-[#1a1d26] p-6 relative">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 text-[#8a90a0] hover:text-[#000000] dark:hover:text-white transition-colors cursor-pointer z-50 p-1.5 rounded-[6px] hover:bg-[#f7f8fb] dark:hover:bg-[#2a2d3d] focus:outline-none"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Title for Desktop - FIXED (not scrollable) */}
                <div className="hidden md:block pb-4 border-b border-[#f0f1f3] dark:border-[#2a2d3d] shrink-0 mb-4">
                  <h2 className="text-[24px] font-bold text-[#000000] dark:text-white tracking-tight leading-tight">
                    {activeEvent.title}
                  </h2>
                </div>

                {/* Scrollable details */}
                <div className="overflow-y-auto no-scrollbar flex-1 pr-1 space-y-5">
                  {/* POV Notice — special highlight */}
                  <div className="flex items-start gap-3 rounded-[10px] border border-red-500/15 dark:border-red-500/20 bg-red-500/[0.04] dark:bg-red-500/[0.06] px-3.5 py-3 relative overflow-hidden">
                    <div className="absolute left-0 inset-y-0 w-[3px] rounded-l-[10px] bg-red-500" />
                    <div className="flex flex-col gap-0.5 pl-1">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">POV Requirement</span>
                      <span className="text-[13px] font-semibold text-red-600 dark:text-red-300 leading-snug">{activeEvent.pov}</span>
                    </div>
                  </div>

                  {/* Metadata List - Clean Typography Layout */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col gap-1 border-b border-[#f0f1f3] dark:border-[#2a2d3d] pb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a90a0]">Participants</span>
                      <span className="text-[13px] font-medium text-[#000000] dark:text-white leading-tight">{activeEvent.participants}</span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-[#f0f1f3] dark:border-[#2a2d3d] pb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a90a0]">Timing</span>
                      <span className="text-[13px] font-medium text-[#000000] dark:text-white leading-tight">{activeEvent.timing}</span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-[#f0f1f3] dark:border-[#2a2d3d] pb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a90a0]">Duration</span>
                      <span className="text-[13px] font-medium text-[#000000] dark:text-white leading-tight">{activeEvent.duration}</span>
                    </div>

                    <div className="flex flex-col gap-1.5 border-b border-[#f0f1f3] dark:border-[#2a2d3d] pb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a90a0]">Overview</span>
                      <p className="text-[13px] leading-relaxed text-[#4b5563] dark:text-[#9aa1b0]">
                        {activeEvent.overview}
                      </p>
                    </div>

                    {/* NEW: IMPORTANT Section */}
                    <div className="flex flex-col gap-1.5 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">IMPORTANT</span>
                      <p className="text-[13px] leading-relaxed text-[#4b5563] dark:text-[#9aa1b0] border-l-2 border-red-500 pl-3.5 italic">
                        {activeEvent.important}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </OrganizerLayout>
  );
}
