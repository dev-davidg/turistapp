import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, ArrowLeft } from "lucide-react";
import { UIButton as Button, UICard as Card, UIBadge as Badge } from "@/ui/kit";
import { supabase } from "@/lib/supabase";

type EventRow = {
  id: string;
  title: string;
  date: string;
  location: string;
  image?: string;
  tags?: string[];
  spotsLeft?: number;
  description?: string;
};

const formatDateSk = (iso: string) => new Date(iso).toLocaleDateString("sk-SK", { day: "2-digit", month: "long", year: "numeric" });

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!id) return;
      if (!supabase) { setLoading(false); return; }
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data && isMounted) setEvent(data as EventRow);
      setLoading(false);
    })();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-3xl p-4"><Card className="h-96 animate-pulse bg-gray-100 dark:bg-gray-900"/></div>
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Event sa nenašiel</h1>
            <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4"/> Späť</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-3"><ArrowLeft className="mr-2 h-4 w-4"/> Späť</Button>
      <Card className="overflow-hidden">
        {event.image && <img src={event.image} alt={event.title} className="h-64 w-full object-cover" />}
        <div className="space-y-4 p-5">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4"/>{formatDateSk(event.date)}</span>
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4"/>{event.location}</span>
            {(event.tags || []).map((t) => <Badge key={t}>{t}</Badge>)}
            {typeof event.spotsLeft === "number" && <Badge tone="red">{event.spotsLeft} miest</Badge>}
          </div>
          {event.description && <p className="text-sm text-gray-700 dark:text-gray-300">{event.description}</p>}
          <div className="flex gap-2">
            <Button>Pridať do kalendára</Button>
            <Link to="/" className="inline-block"><Button variant="outline">Domov</Button></Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
