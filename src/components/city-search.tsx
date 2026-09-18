import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatInt } from "@/data/format";
import { searchMunicipios, type MunRecord } from "@/data/cities";
import { cn } from "@/lib/utils";

type Props = {
  uf?: string;
  selected?: MunRecord;
  onSelect: (id: number) => void;
  className?: string;
  placeholder?: string;
};

export function CitySearch({ uf, selected, onSelect, className, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const results = useMemo(() => searchMunicipios(q, uf, 48), [q, uf]);
  const empty = placeholder ?? "Buscar município";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-11 w-full justify-start gap-2 px-3 font-normal", className)}
        >
          <Search className="size-4 text-muted-foreground" />
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? `${selected.n} — ${selected.u}` : empty}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nome, UF ou código IBGE"
            value={q}
            onValueChange={setQ}
          />
          <CommandList>
            <CommandEmpty>Nenhum município encontrado.</CommandEmpty>
            <CommandGroup heading={uf ? `Municípios de ${uf}` : "Municípios"}>
              {results.map((m) => (
                <CommandItem
                  key={m.i}
                  value={`${m.i}`}
                  onSelect={() => {
                    onSelect(m.i);
                    setOpen(false);
                    setQ("");
                  }}
                >
                  <span className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="truncate">{m.n}</span>
                    <span className="text-muted-foreground">{m.u}</span>
                  </span>
                  <span className="tabular text-xs text-muted-foreground">
                    {formatInt(m.p)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
