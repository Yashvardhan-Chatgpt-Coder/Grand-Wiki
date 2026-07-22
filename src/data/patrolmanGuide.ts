export interface PenalCodeEntry {
  code: string;
  description: string;
  fine: string;
  time: string;
  stars: string;
  points?: string;
  highlight?: 'no-bailout' | 'sentence-varies' | 'revocation-driver' | 'revocation-gun' | 'revocation-all' | 'blacklist' | 'dismissal';
}

export interface PatrolmanArticle {
  title: string;
  type: 'penal' | 'traffic' | 'misdemeanor' | 'parking';
  notes?: string[];
  entries: PenalCodeEntry[];
}

export const PATROLMAN_GUIDE_DATA: PatrolmanArticle[] = [
  {
    title: "ARTICLE 2: CRIMES AGAINST SOCIETY",
    type: "penal",
    notes: [
      "Yellow Highlight = No Bailout",
      "Blue Highlight = Sentence Varies on Officer’s Judgement",
      "Red Highlight = Revocation of Driver’s License (Approval of High Command or DOJ)",
      "Green Highlight = Revocation of Gun License",
      "Pink Highlight = Revocation of All License"
    ],
    entries: [
      { code: "P.C. 2.1.1", description: "Possession of Narcotics - Less than 4 or less Units", fine: "$15,000", time: "-", stars: "-" },
      { code: "P.C. 2.1.1 (Repeat)", description: "Possession of Narcotics - Repeat Offense", fine: "$10,000", time: "15", stars: "1" },
      { code: "P.C. 2.1.2", description: "Possession of Narcotics – 5 to 9 Units", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.1.3", description: "Possession of Narcotics with Intent to Distribute", fine: "$30,000", time: "45", stars: "3", highlight: "no-bailout" },
      { code: "P.C. 2.1.6", description: "Possession of Prohibited Items (Less than 3)", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.1.7", description: "Possession of Prohibited Items with Intent to Distribute (More than 3)", fine: "$30,000", time: "45", stars: "3", highlight: "no-bailout" },
      { code: "P.C. 2.2.1", description: "Culpable Homicide / Manslaughter", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.2.2", description: "Murder or Attempted Murder", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 2.2.3", description: "Murder or Attempted Murder - Premediated", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 2.3.1", description: "Assault by Threat", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.4.1", description: "Abandonment", fine: "$10,000", time: "15", stars: "1" },
      { code: "P.C. 2.4.2", description: "Failure to Act / Abandonment by Civil Servant", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.5.1", description: "Kidnapping or Attempted Kidnapping", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 2.5.2", description: "Kidnapping or Attempted Kidnapping - Civil Servant", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 2.5.3", description: "Kidnapping or Attempted Kidnapping - LEO", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 2.6.1", description: "Taking a Hostage", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 2.7.1", description: "Sexual Harassment", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 2.7.2", description: "Sexual Assault", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 2.7.3", description: "Rape", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 2.8.1", description: "Forgery of Documents", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.8.2", description: "Dealing in Forged Documents", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 2.9.1", description: "Petty Larceny or Theft", fine: "$10,000", time: "15", stars: "1" },
      { code: "P.C. 2.9.1 (Repeat)", description: "Petty Larceny or Theft - Repeat Offence", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.9.4", description: "Grand Theft Auto", fine: "$40,000", time: "60", stars: "4", highlight: "revocation-driver" },
      { code: "P.C. 2.10", description: "Armed Robbery", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 2.11", description: "Heist", fine: "$40,000", time: "60", stars: "4", highlight: "no-bailout" },
      { code: "P.C. 2.12", description: "Extortion", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 2.13", description: "Fraud", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.14", description: "Creation of Criminal Community", fine: "$40,000", time: "60", stars: "4", highlight: "no-bailout" },
      { code: "P.C. 2.15.1", description: "Participation in Banditry", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 2.15.2", description: "Banditry as a Leader", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 2.16.1", description: "Assault", fine: "$10,000", time: "-", stars: "-" },
      { code: "P.C. 2.16.2", description: "Assault with Intent to Harm", fine: "$10,000", time: "15", stars: "1" },
      { code: "P.C. 2.16.3", description: "Assault GBH", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.17.1", description: "Unlicensed Firearms Carry", fine: "$10,000", time: "-", stars: "-" },
      { code: "P.C. 2.17.2", description: "Excessive Firearms Carry (Overcarrying)", fine: "$40,000", time: "60", stars: "4", highlight: "revocation-gun" },
      { code: "P.C. 2.17.3", description: "Possession of Illegal Firearms", fine: "$20,000", time: "30", stars: "2", highlight: "revocation-gun" },
      { code: "P.C. 2.17.4", description: "Dealing in Illegal Firearms", fine: "$40,000", time: "60", stars: "4", highlight: "revocation-gun" },
      { code: "P.C. 2.17.5", description: "Possession of State Issued Items", fine: "$40,000", time: "60", stars: "4", highlight: "no-bailout" },
      { code: "P.C. 2.17.6", description: "Possession of Illegal Body Armour", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.17.7", description: "Brandishing a Firearm", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 2.17.8", description: "Discharging of a Firearm", fine: "$10,000 - $20,000", time: "-", stars: "-" },
      { code: "P.C. 2.17.8 (Repeat)", description: "Discharging of a Firearm - Repeat Offense", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.17.9", description: "Public Carrying of a Firearm", fine: "$10,000", time: "-", stars: "-" },
      { code: "P.C. 2.17.9 (Repeat)", description: "Public Carrying of a Firearm - Repeat Offence", fine: "$10,000", time: "15", stars: "1" },
      { code: "P.C. 2.18.1", description: "Misappropriation of a Vehicle (Reckless Driving)", fine: "$20,000", time: "30", stars: "2", highlight: "revocation-driver" },
      { code: "P.C. 2.18.2", description: "Misappropriation of a Official or State Vehicle", fine: "$30,000", time: "45", stars: "3", highlight: "revocation-driver" },
      { code: "P.C. 2.18.3", description: "Misuse of a Vehicle", fine: "$10,000", time: "15", stars: "1" },
      { code: "P.C. 2.18.4", description: "Vehicle Used in Criminal Activity", fine: "$10,000", time: "-", stars: "-" },
      { code: "P.C. 2.19", description: "Pimping", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.20", description: "Prostitution", fine: "$10,000", time: "-", stars: "-" },
      { code: "P.C. 2.20 (Repeat)", description: "Prostitution - Repeat Offense", fine: "$10,000", time: "15", stars: "1" },
      { code: "P.C. 2.21", description: "Hooliganism", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 2.22", description: "Bribery or Attempted Bribery of an Official", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 2.23", description: "Failure to Pay Fines", fine: "$50,000", time: "60", stars: "4" },
      { code: "P.C. 2.24.1", description: "Leaving the Scene", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.24.2", description: "Evading Arrest", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 2.25", description: "Attempted or Actual Escape from Custody", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 2.26", description: "Insubordination / Failure to Comply", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 2.27", description: "Violation of Privacy", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.28", description: "Intentional Spreading of Disease", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.29", description: "Breaking and Entering into a Private Residence", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 2.30.1", description: "Animal Cruelty", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 2.30.2", description: "Killing on Animal or Pet", fine: "$30,000", time: "45", stars: "3" }
    ]
  },
  {
    title: "ARTICLE 3: CRIMES AGAINST THE STATE",
    type: "penal",
    notes: [
      "Yellow Highlight = No Bailout",
      "Blue Highlight = Sentence Varies on Officer’s Judgement",
      "Red Highlight = Revocation of Driver’s License (Approval of High Command or DOJ)",
      "Green Highlight = Revocation of Gun License",
      "Pink Highlight = Revocation of All License",
      "Black Highlight = Blacklist (length determined by Law)",
      "Gray Highlight = Dismissal from Organization"
    ],
    entries: [
      { code: "P.C. 3.1.1", description: "Terrorism as a Participant", fine: "$40,000", time: "60", stars: "4", highlight: "no-bailout" },
      { code: "P.C. 3.1.2", description: "Leading of Terrorism", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 3.2.1", description: "Participating in a Riot", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 3.2.2", description: "Leading of a Riot", fine: "$30,000", time: "45", stars: "3", highlight: "no-bailout" },
      { code: "P.C. 3.3.1", description: "Sedition as a Participant", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 3.3.2", description: "Leading of Sedition", fine: "$40,000", time: "60", stars: "4", highlight: "no-bailout" },
      { code: "P.C. 3.4.1", description: "Treason as a Participant", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 3.4.2", description: "Leading of Treason (High Treason)", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 3.5.1", description: "Obstruction of an Investigation", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 3.5.2", description: "Obstruction of an Officer or Civil Servant", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 3.5.3", description: "Obstruction of an Arrest or Detention", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 3.6.1", description: "Murder, or Attempted Murder of LEO in the Line of Duty (NG Raid or Store Robbery)", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 3.6.2", description: "Murder, or Attempted Murder of a Civil Servant or LEO", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 3.7", description: "False Reporting", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 3.8.1", description: "Trespassing", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 3.8.2", description: "Trespassing on Secure Facility", fine: "$30,000", time: "45", stars: "3", highlight: "no-bailout" },
      { code: "P.C. 3.9.1", description: "Collusion with criminal elements", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 3.11.1", description: "Failure to Submit documents", fine: "$10,000", time: "15", stars: "1" },
      { code: "P.C. 3.11.2", description: "Failure to identify", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 3.12.1", description: "Disclosure of Information", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 3.12.2", description: "Disclosure of Classified Information", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 3.13.1", description: "Posing as a Civil Servant", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 3.13.2", description: "Posing as a Law Enforcement Officer", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 3.14.1", description: "Corruption by a State Employee", fine: "$40,000", time: "60", stars: "4", highlight: "dismissal" }
    ]
  },
  {
    title: "ARTICLE 4: MALFEASANCE",
    type: "penal",
    notes: [
      "Yellow Highlight = No Bailout",
      "Black Highlight = Blacklist (length determined by Law)",
      "Gray Highlight = Dismissal from Organization"
    ],
    entries: [
      { code: "P.C. 4.1.1", description: "Disobeying an Order of a Superior", fine: "$40,000", time: "60", stars: "4", highlight: "dismissal" },
      { code: "P.C. 4.1.2", description: "Disobeying an Order of a State Leader", fine: "$40,000", time: "60", stars: "4", highlight: "dismissal" },
      { code: "P.C. 4.1.3", description: "Disobeying an Order of a Judicial Authority", fine: "$40,000", time: "60", stars: "4", highlight: "dismissal" },
      { code: "P.C. 4.2.1", description: "Negligence by a Civil Servant", fine: "$40,000", time: "60", stars: "4", highlight: "dismissal" },
      { code: "P.C. 4.2.2", description: "Negligence by a Law Enforcement Officer", fine: "$30,000", time: "45", stars: "3", highlight: "dismissal" },
      { code: "P.C. 4.3", description: "Sabotage", fine: "$75,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 4.4.1", description: "Disclosure of Police Information", fine: "$30,000", time: "45", stars: "3", highlight: "dismissal" },
      { code: "P.C. 4.4.1 (Federal)", description: "Disclosure of Federal Information", fine: "$40,000", time: "60", stars: "4", highlight: "dismissal" },
      { code: "P.C. 4.4.2", description: "Disclosure of State Information", fine: "$50,000", time: "75", stars: "5", highlight: "dismissal" },
      { code: "P.C. 4.5", description: "Arbitrariness", fine: "$20,000", time: "30", stars: "2", highlight: "dismissal" },
      { code: "P.C. 4.6", description: "Receiving a Bribe", fine: "$40,000", time: "60", stars: "4", highlight: "dismissal" },
      { code: "P.C. 4.7.1", description: "Conduct Unbecoming", fine: "$20,000", time: "30", stars: "2", highlight: "dismissal" },
      { code: "P.C. 4.7.2", description: "Gross Ethics Violations", fine: "$30,000", time: "45", stars: "3", highlight: "dismissal" }
    ]
  },
  {
    title: "ARTICLE 5: TRAFFIC STATUTE CRIMES",
    type: "traffic",
    notes: [
      "Red Highlight = Revocation of Driver’s License"
    ],
    entries: [
      { code: "P.C. 5.1.1", description: "Speeding up to 30km/h over the limit", fine: "$5,000", time: "-", stars: "-" },
      { code: "P.C. 5.1.2", description: "Speeding up to 60 km/h over the limit", fine: "$10,000", time: "-", stars: "-" },
      { code: "P.C. 5.1.3", description: "Speeding up to 90 km/h over the limit", fine: "$15,000", time: "-", stars: "-" },
      { code: "P.C. 5.1.4", description: "Speeding in Excess of 90km/h over the limit", fine: "$20,000", time: "30", stars: "2", highlight: "revocation-driver" },
      { code: "P.C. 5.5", description: "Abandoning a Vehicle (Impound)", fine: "$5,000", time: "-", stars: "-" },
      { code: "P.C. 5.6", description: "Unsafe Transporting of a Passenger", fine: "$10,000", time: "-", stars: "-" }
    ]
  },
  {
    title: "ARTICLE 6: JUDICIAL CRIMES",
    type: "penal",
    notes: [
      "Yellow Highlight = No Bailout"
    ],
    entries: [
      { code: "P.C. 6.1.1", description: "Contempt of Court", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 6.1.1 (State)", description: "Contempt of Court by a State Employee", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 6.2.1", description: "Disruption of the Trial", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 6.2.2", description: "Disruption of the Trial by a State Employee", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 6.3", description: "Threats to Litigants", fine: "$40,000", time: "60", stars: "4" },
      { code: "P.C. 6.4", description: "Falsification of Evidence", fine: "$40,000", time: "60", stars: "4", highlight: "no-bailout" },
      { code: "P.C. 6.5", description: "Perjury", fine: "$40,000", time: "60", stars: "4" }
    ]
  },
  {
    title: "ARTICLE 8: COMMERCIAL & TAXATION CRIMES",
    type: "penal",
    notes: [],
    entries: [
      { code: "P.C. 8.1.1", description: "Selling of Prohibited Items in Public Shops (Less than 5)", fine: "$20,000", time: "15", stars: "1" },
      { code: "P.C. 8.1.2", description: "Distribution of Prohibited Items (5 - 10)", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 8.1.3", description: "Dealing in Prohibited Items (10 or more)", fine: "$30,000", time: "45", stars: "3", highlight: "no-bailout" },
      { code: "P.C. 8.2.1", description: "False Advertising", fine: "$15,000", time: "-", stars: "-" },
      { code: "P.C. 8.3.1", description: "Tax Evasion", fine: "$30,000", time: "-", stars: "-" },
      { code: "P.C. 8.3.2", description: "Felony Tax Evasion", fine: "$40,000", time: "60", stars: "4" }
    ]
  },
  {
    title: "ARTICLE 9: CORRECTIONAL CRIMES",
    type: "penal",
    notes: [
      "Yellow Highlight = No Bailout",
      "Dismissal / Blacklist from organization apply to State Employees"
    ],
    entries: [
      { code: "P.C. 9.1.1", description: "Failure to Behave (Isolation)", fine: "Custom", time: "-", stars: "-" },
      { code: "P.C. 9.1.2", description: "Failure to Comply", fine: "Custom", time: "-", stars: "-" },
      { code: "P.C. 9.1.3", description: "Sexual Acts with Inmates", fine: "Custom", time: "-", stars: "-" },
      { code: "P.C. 9.1.4", description: "Sabotage", fine: "Custom", time: "-", stars: "-" },
      { code: "P.C. 9.1.5", description: "Attempted Escape", fine: "Custom", time: "-", stars: "-" },
      { code: "P.C. 9.1.6", description: "Attempted Mass Escape", fine: "Custom", time: "-", stars: "-" },
      { code: "P.C. 9.1.7", description: "Incitement to Riot", fine: "Custom", time: "-", stars: "-" },
      { code: "P.C. 9.1.8", description: "Rioting", fine: "Custom", time: "-", stars: "-" },
      { code: "P.C. 9.1.9", description: "Assaulting an Officer", fine: "Custom", time: "-", stars: "-" },
      { code: "P.C. 9.2.1", description: "Smuggling of Contraband", fine: "$30,000", time: "45", stars: "3" },
      { code: "P.C. 9.2.2", description: "Smuggling of Contraband by a State Employee", fine: "$40,000", time: "60", stars: "4", highlight: "dismissal" },
      { code: "P.C. 9.3.1", description: "Aiding an Escape", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 9.3.2", description: "Aiding an Escape by a State Employee", fine: "$30,000", time: "45", stars: "3", highlight: "dismissal" },
      { code: "P.C. 9.4.1", description: "Aiding a Mass Escape", fine: "$50,000", time: "75", stars: "5", highlight: "no-bailout" },
      { code: "P.C. 9.4.1 (State)", description: "Aiding a Mass Escape by a State Employee", fine: "$50,000", time: "75", stars: "5", highlight: "dismissal" },
      { code: "P.C. 9.5.1", description: "Sexual Acts with Inmates by a Civilian", fine: "$20,000", time: "30", stars: "2" },
      { code: "P.C. 9.5.2", description: "Sexual Acts with Inmates by a State Employee", fine: "$20,000", time: "30", stars: "2", highlight: "dismissal" }
    ]
  },
  {
    title: "ARTICLE 10: VIOLATIONS OF PUBLIC ORDER (MISDEMEANOURS)",
    type: "misdemeanor",
    notes: [
      "A Misdemeanour does not ordinarily carry any period of imprisonment unless multiple misdemeanours are committed.",
      "Suspect once identified and fined is to be released immediately and may not be searched.",
      "If combination exceeds 5-Points, suspect can get up to 30-months prison + $25,000 fine."
    ],
    entries: [
      { code: "P.C. 10.1.1", description: "Public Obscenity", fine: "$5,000", time: "-", stars: "-", points: "1" },
      { code: "P.C. 10.1.2", description: "Public Nudity", fine: "$5,000", time: "-", stars: "-", points: "1" },
      { code: "P.C. 10.1.3", description: "Public Nuisance", fine: "$10,000", time: "-", stars: "-", points: "2" },
      { code: "P.C. 10.1.4", description: "Public Drunkenness", fine: "$10,000", time: "-", stars: "-", points: "2" },
      { code: "P.C. 10.1.5", description: "Public Intoxication (Drug Use)", fine: "$15,000", time: "-", stars: "-", points: "3" },
      { code: "P.C. 10.1.6", description: "Public Harassment", fine: "$10,000", time: "-", stars: "-", points: "2" },
      { code: "P.C. 10.1.6 (Repeat)", description: "Public Harassment (Repeat Offence)", fine: "$10,000", time: "15", stars: "1" }
    ]
  },
  {
    title: "TRAFFIC CODE (T.C.)",
    type: "traffic",
    notes: [
      "Yellow Highlight = No Bailout",
      "Red Highlight = Revocation of Driver’s License"
    ],
    entries: [
      { code: "T.C. 2.1", description: "Absence of Valid Licence Plate", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 3.2.1", description: "Driving the Opposite Lane", fine: "$10,000", time: "-", stars: "-" },
      { code: "T.C. 3.2.2", description: "Driving the Opposite Lane on Highway", fine: "$15,000", time: "30", stars: "2" },
      { code: "T.C. 3.3", description: "Stopping on Road for No Reason", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 3.5.1", description: "Driving on Deserted Sidewalks", fine: "$3,000", time: "-", stars: "-" },
      { code: "T.C. 3.5.2", description: "Chaotic Movement Between Lanes", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 3.5.3", description: "Failure to Keep Distance", fine: "$3,000", time: "-", stars: "-" },
      { code: "T.C. 3.5.4", description: "Hard Braking", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 3.5.5", description: "Creating Obstruction for Overtaking", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 3.6", description: "Driving Under Influence", fine: "$20,000", time: "30", stars: "2", highlight: "revocation-driver" },
      { code: "T.C. 3.7.1", description: "Participation in a Street Race", fine: "$10,000", time: "-", stars: "-" },
      { code: "T.C. 3.7.2", description: "Organization of a Street Race", fine: "$20,000", time: "30", stars: "2" },
      { code: "T.C. 5.5", description: "Abandoning a Vehicle", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 5.6", description: "Unsafe Transporting of a Passenger", fine: "$10,000", time: "-", stars: "-" }
    ]
  },
  {
    title: "PARKING VIOLATIONS (T.C. 6.2)",
    type: "parking",
    notes: [
      "Parking along roadways: a driver must park a vehicle in the direction of traffic with its wheels parallel and next to the curb or side of the road, or two right wheels on the curb."
    ],
    entries: [
      { code: "T.C. 6.2.A", description: "Parking On Red Curb", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.B", description: "Blocking a Lane of Traffic (More than 1/2)", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.C", description: "Blocking the Exit of Anywhere", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.D", description: "Parking At or In a Crosswalk", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.E", description: "Blocking more than 2/3 of the Sidewalk or Bike Path", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.F", description: "Parking On Any Dividing Strip (Double Yellow Lines or No Parking Stripes)", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.G", description: "Facing the Opposing Flow of Traffic", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.H", description: "Stopping On Bridges or In Tunnels", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.I", description: "Stopping On a Highway or Freeway (Emergency Stops are Allowed)", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.J", description: "Parking Closer than 20 Metres (66ft) to a Building on Fire", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.K", description: "Blocking Bus Stops", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.L", description: "Parking On Railroad Tracks or within the Skidding of a Train Wagon", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.M", description: "In Parking Spaces Marked in Yellow", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.N", description: "Parking In Violation of Road Surface Markings", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.2.P", description: "Parking On Lawns, in Green Spaces, or other Places not Intended for Parking", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 6.4", description: "Unauthorised Vehicle Parking in Prison", fine: "$15,000", time: "-", stars: "-" }
    ]
  },
  {
    title: "SPECIFIC LOCATION PARKING FINES",
    type: "parking",
    notes: ["Fines for illegal parking at specific critical public locations"],
    entries: [
      { code: "T.C. 7.1", description: "Illegal parking at Capitol", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.2", description: "Illegal parking at Casino", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.3", description: "Illegal parking at Real Estate Agency", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.4", description: "Illegal parking at Pillbox Hospital", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.5", description: "Illegal parking at Legion Square Bank", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.6", description: "Illegal parking at LSPD", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.7", description: "Illegal parking at Power plant", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.8", description: "Illegal parking at SAHP", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.9", description: "Illegal parking at Quarry 1", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.9", description: "Illegal parking at Quarry 2", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.9", description: "Illegal parking at Quarry 3, 4", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.9", description: "Illegal parking at Quarry 5, 6, 7", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.9", description: "Illegal parking at Quarry 8", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.10", description: "Illegal parking at Sawmill", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.11", description: "Illegal parking at Farm 1", fine: "$5,000", time: "-", stars: "-" },
      { code: "T.C. 7.12", description: "Illegal parking at Farm 2", fine: "$5,000", time: "-", stars: "-" }
    ]
  }
];
