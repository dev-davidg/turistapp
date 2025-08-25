import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Search, User, CheckCircle2, ChevronRight } from "lucide-react";
import { UIButton as Button, UICard as Card, UIBadge as Badge, UITabs } from "@/ui/kit";
import { supabase, SUPABASE_DEBUG } from "@/lib/supabase";

type EventRow = {
  id: string;
  title: string;
  date: string;       // ISO
  location: string;
  image?: string;
  tags?: string[];
  spotsLeft?: number;
};

type ChallengeRow = {
  id: string;
  title: string;
  points: number;
  difficulty: string;   // "ľahká" | "stredná" | "ťažká"
  image?: string;
  tags?: string[];
};

const fallbackEvents: EventRow[] = [
  { id:"e1", title:"Nočná turistika na Hrebienok", date:"2025-09-12", location:"Vysoké Tatry", image:"https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop", tags:["Turistika","Nočný pochod"], spotsLeft:8 },
  { id:"e2", title:"Východ slnka na Srđ",        date:"2025-09-05", location:"Dubrovník",     image:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop", tags:["Výhľady","Fotowalk"],   spotsLeft:12 },
  { id:"e3", title:"Beh okolo Štrbského plesa",  date:"2025-09-28", location:"Vysoké Tatry",  image:"https://images.unsplash.com/photo-1500043357865-c6b8827edf80?q=80&w=1200&auto=format&fit=crop", tags:["Beh","Jazero"],       spotsLeft:20 },
];

const fallbackChallenges: ChallengeRow[] = [
  { id:"c1", title:"10 000 krokov denne – 14 dní", points:120, difficulty:"ľahká", image:"https://images.unsplash.com/photo-1502810190503-8303352d3a36?q=80&w=1200&auto=format&fit=crop", tags:["Zdravie","Denná výzva"] },
  { id:"c2", title:"3 hrady za víkend", points:200, difficulty:"stredná", image:"https://images.unsplash.com/photo-1520986606214-8b456906c813?q=80&w=1200&auto=format&fit=crop", tags:["Objavovanie","História"] },
];

const formatDateSk = (iso: string) =>
  new Date(iso).toLocaleDateString("sk-SK", { day: "2-digit", month: "long", year: "numeric" });

const EventCard = ({ e }: { e: EventRow }) => {
  const [joined, setJoined] = useState(false);
  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="overflow-hidden">
        <div className="relative h-40 w-full">
          {e.image ? <img src={e.image} alt={e.title} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-emerald-100" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0" />
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <Badge tone="amber" className="backdrop-blur-sm">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateSk(e.date)}
            </Badge>
            {typeof e.spotsLeft === "number" && e.spotsLeft <= 10 && (
              <Badge tone="red" className="backdrop-blur-sm">{e.spotsLeft} miest</Badge>
            )}
          </div>
        </div>
        <div className="space-y-3 p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-gray-900 dark:text-gray-50">{e.title}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <MapPin className="h-4 w-4" /> {e.location}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setJoined((j) => !j)} className="w-full">
              {joined ? (<span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Pridané</span>) : ("Zúčastniť sa")}
            </Button>
            <Link to={`/event/${e.id}`} className="w-12">
              <Button variant="outline" className="w-12" aria-label="Detaily">
                <ChevronRight className="mx-auto h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const ChallengeCard = ({ c }: { c: ChallengeRow }) => (
  <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
    <Card className="overflow-hidden">
      <div className="relative h-36 w-full">
        {c.image ? <img src={c.image} alt={c.title} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-emerald-100" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge tone="violet" className="backdrop-blur-sm">{c.points} bodov</Badge>
          <Badge tone={c.difficulty === "ľahká" ? "green" : c.difficulty === "stredná" ? "amber" : "red"} className="backdrop-blur-sm">
            {c.difficulty}
          </Badge>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900 dark:text-gray-50">{c.title}</h3>
        <div className="flex flex-wrap gap-2">
          {(c.tags || []).map((t) => <Badge key={t}>{t}</Badge>)}
        </div>
        <div className="flex items-center gap-2">
          <Button className="w-full">Začať</Button>
          <Button variant="outline" className="w-12" aria-label="Detaily"><ChevronRight className="mx-auto h-5 w-5" /></Button>
        </div>
      </div>
    </Card>
  </motion.div>
);

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"events" | "challenges">("events");
  const [loadingE, setLoadingE] = useState(true);
  const [events, setEvents] = useState<EventRow[]>(fallbackEvents);
  const [loadingC, setLoadingC] = useState(true);
  const [challenges, setChallenges] = useState<ChallengeRow[]>(fallbackChallenges);
  const [srcErr, setSrcErr] = useState<string | null>(null);

  // EVENTS
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!supabase) { setSrcErr("no-supabase"); setLoadingE(false); return; }
      setLoadingE(true);
      const { data, error } = await supabase
        .from("events")
        .select("id,title,date,location,image,tags,spotsLeft")
        .order("date", { ascending: true })
        .limit(20);
      if (error) setSrcErr(`fetch-error: ${error.message}`);
      if (!error && data && isMounted) setEvents(data as EventRow[]);
      setLoadingE(false);
    })();
    return () => { isMounted = false; };
  }, []);

  // CHALLENGES
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!supabase) { setLoadingC(false); return; }
      setLoadingC(true);
      const { data, error } = await supabase
        .from("challenges")
        .select("id,title,points,difficulty,image,tags")
        .order("points", { ascending: false })
        .limit(20);
      if (!error && data && isMounted) setChallenges(data as ChallengeRow[]);
      setLoadingC(false);
    })();
    return () => { isMounted = false; };
  }, []);

  const q = query.toLowerCase();
  const filteredEvents = useMemo(
    () => events.filter((e) => `${e.title} ${e.location} ${(e.tags||[]).join(" ")}`.toLowerCase().includes(q)),
    [q, events]
  );
  const filteredChallenges = useMemo(
    () => challenges.filter((c) => `${c.title} ${(c.tags||[]).join(" ")}`.toLowerCase().includes(q)),
    [q, challenges]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <header className="sticky top-0 z-30 border-b border-emerald-100/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600" />
            <span className="bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-lg font-extrabold text-transparent">Turistapp</span>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hľadaj eventy a výzvy"
                className="w-80 rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <Button variant="outline" className="px-3 py-2"><User className="mr-2 h-4 w-4" /> Profil</Button>
          </div>
          <div className="md:hidden"><Button variant="outline" className="px-3 py-2" aria-label="Profil"><User className="h-5 w-5" /></Button></div>
        </div>
      </header>

      {/* Debug badge – pomáha overiť, či idú dáta z DB alebo fallback */}
      <div className="mb-2 px-4 text-xs text-gray-500">
        Zdroj eventov: {srcErr ? "fallback (3)" : `DB (${events.length})`}
        {" · "}
        env: {SUPABASE_DEBUG.hasUrl ? `url=${SUPABASE_DEBUG.urlHost}` : "url=missing"}
        {" / "}
        {SUPABASE_DEBUG.hasKey ? "key=present" : "key=missing"}
        {srcErr ? ` · ${srcErr}` : ""}
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <UITabs
            tabs={[{ value:"events", label:"Eventy" }, { value:"challenges", label:"Výzvy" }]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <AnimatePresence mode="popLayout">
          {activeTab === "events" ? (
            <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loadingE ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="h-72 animate-pulse bg-gray-100 dark:bg-gray-900" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredEvents.map((e) => (<EventCard key={e.id} e={e} />))}
                  {filteredEvents.length === 0 && (
                    <Card className="p-6 text-center text-sm text-gray-600 dark:text-gray-300">
                      Žiadne eventy pre dané filtrovanie.
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="challenges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loadingC ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="h-64 animate-pulse bg-gray-100 dark:bg-gray-900" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredChallenges.map((c) => (<ChallengeCard key={c.id} c={c} />))}
                  {filteredChallenges.length === 0 && (
                    <Card className="p-6 text-center text-sm text-gray-600 dark:text-gray-300">
                      Žiadne výzvy pre dané filtrovanie.
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
