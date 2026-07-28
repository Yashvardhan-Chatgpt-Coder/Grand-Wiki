import { createFileRoute } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/qna")({
  head: () => ({
    meta: [{ title: "Questions & Answers | Grand Wiki" }],
  }),
  validateSearch: (search: Record<string, unknown>): { cat?: string } => {
    return {
      cat: typeof search.cat === 'string' ? search.cat : undefined,
    };
  },
  component: QnaPage,
});

type QnAItem = {
  question: string;
  answer: string | { intro?: string; examples?: { title: string; items: string[] }[] };
};

const GENERAL_QNA: QnAItem[] = [
  {
    question: "What is Meta Gaming?",
    answer: {
      intro: "Meta Gaming occurs when a player uses out-of-character (OOC) communication to gain information about in-character (IC) situations, giving them an unfair advantage.",
      examples: [
        {
          title: "Common Examples",
          items: [
            "Using Discord to communicate during roleplay situations",
            "Recognizing someone by their ID number above their head",
          ],
        },
        {
          title: "Unique Examples",
          items: [
            "Using map blips to identify your subordinates",
            "Discussing graffiti locations from notifications",
          ],
        },
      ],
    },
  },
  {
    question: "What is Power Gaming?",
    answer: {
      intro: "Power Gaming happens when a player performs actions that are possible in the game but impossible in real life.",
      examples: [
        {
          title: "Common Examples",
          items: [
            "Healing someone while holding a gun",
            "Using radio while holding a large weapon",
          ],
        },
        {
          title: "Unique Examples",
          items: [
            "Cuffing someone inside an isolation cell while standing outside",
            "Eating food while underwater",
          ],
        },
      ],
    },
  },
  {
    question: "What is Fail RP?",
    answer: {
      intro: "Fail RP occurs when a player doesn't follow server rules and scripts, disrupting roleplay and gaining unfair advantages.",
      examples: [
        {
          title: "Common Examples",
          items: [
            "Putting someone in a vehicle without telling them",
            "Collecting debt silently without any communication",
          ],
        },
        {
          title: "Unique Examples",
          items: [
            "Walking through an active gunfight because you're not involved",
            "Refusing to negotiate during a hostage situation",
          ],
        },
      ],
    },
  },
  {
    question: "What is Fear RP?",
    answer: {
      intro: "Fear RP violation happens when a player doesn't show fear for their life when threatened by multiple people with guns.",
      examples: [
        {
          title: "Examples",
          items: [
            "Trying to run away while 4 people are pointing guns at you",
            "Not following demands when gangsters are threatening you with weapons",
          ],
        },
      ],
    },
  },
  {
    question: "What is UB (Unrealistic Behavior)?",
    answer: {
      intro: "Unrealistic Behavior is when a player does something unrealistic to avoid proper roleplay.",
      examples: [
        {
          title: "Common Examples",
          items: [
            "UB Driving: Jumping cars on mountains",
            "UB Demand: Randomly telling people to leave an area without reason",
          ],
        },
        {
          title: "Unique Examples",
          items: [
            "UB MPM: Placing money printing machines in locations not accessible by foot",
            "UB Begging: Begging next to NPCs so players accidentally pay you instead of the NPC",
          ],
        },
      ],
    },
  },
  {
    question: "What is NLR (New Life Rule)?",
    answer: "The New Life Rule states that if you die at a location, you cannot return there for 15 minutes. After death, your character has no memory of their previous life, so returning to continue a fight breaks this rule.",
  },
  {
    question: "Can you go back to the same location after dying?",
    answer: "No, you must wait 15 minutes before returning to the location where you died. This is because your character has no memory of their past life after respawning.",
  },
  {
    question: "Can you kill anyone in a neutral zone?",
    answer: {
      intro: "Yes, you can kill in neutral zones only in specific situations:",
      examples: [
        {
          title: "Allowed Scenarios",
          items: [
            "When someone is on your private property",
            "For self-defense if someone is trying to kill you",
            "During events like robberies or valuable cases (after giving proper demands)",
            "During caravan (no demands needed, can shoot directly)",
            "During capture the flag events (participants can be shot without demands)",
            "If someone approaches solar panels during protection (no demands needed)",
            "If someone approaches your money printing machine (no demands needed)",
          ],
        },
      ],
    },
  },
];

function QnaPage() {
  const search = Route.useSearch();
  const cat = search.cat;

  const categoryName = cat === "general" || !cat ? "General" : cat.toUpperCase();
  const questionsData = cat === "general" || !cat ? GENERAL_QNA : [];

  return (
    <OrganizerLayout header={<SoftwareHeader title="Questions & Answers" />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0 bg-[#f7f8fb] dark:bg-black">
        <header className="shrink-0 border-b border-[#e7e9f0] dark:border-[#222326] bg-white dark:bg-black px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-[30px] font-semibold text-[#000000] dark:text-white">{categoryName} Questions</h1>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-8">
          {questionsData.length > 0 ? (
            <div className="w-full">
              <Accordion type="single" collapsible className="space-y-4">
                {questionsData.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-b border-[#e2e5ec] dark:border-[#222326]"
                  >
                    <AccordionTrigger className="py-4 text-[15px] font-semibold text-[#000000] dark:text-white hover:no-underline cursor-pointer">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5">
                      {typeof item.answer === "string" ? (
                        <p className="text-[14px] leading-relaxed text-[#4b5563] dark:text-[#a0a5b1]">
                          {item.answer}
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {item.answer.intro && (
                            <p className="text-[14px] leading-relaxed text-[#4b5563] dark:text-[#a0a5b1]">
                              {item.answer.intro}
                            </p>
                          )}
                          {item.answer.examples?.map((example, idx) => (
                            <div key={idx} className="space-y-2">
                              <p className="text-[13px] font-semibold text-[#000000] dark:text-white">
                                {example.title}:
                              </p>
                              <ul className="space-y-2 pl-5">
                                {example.items.map((exItem, exIdx) => (
                                  <li
                                    key={exIdx}
                                    className="text-[14px] leading-relaxed text-[#4b5563] dark:text-[#a0a5b1] list-disc"
                                  >
                                    {exItem}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[14px] text-[#666666] dark:text-[#888991]">
                No questions available for this category yet.
              </p>
            </div>
          )}
        </main>
      </div>
    </OrganizerLayout>
  );
}
