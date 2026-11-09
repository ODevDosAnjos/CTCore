import { useState } from "react";
import { Download } from "lucide-react";
import { Card, Section } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Modal } from "@/components/Modal";
import { SidePanel } from "@/components/SidePanel";
import { Stepper } from "@/components/Stepper";
import { BrandMark } from "@/components/layout/BrandMark";
import { UnitMenu } from "@/components/layout/UnitMenu";
import { DataTable } from "@/components/query/DataTable";
import { RowCard } from "@/components/query/RowCard";
import { CanvasPagination } from "@/components/query/Pagination";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { GraduationBelt } from "@/components/ui/graduation-belt";
import { ModalityDot } from "@/components/ui/modality-dot";
import { Avatar, Person } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CodeInput } from "@/components/ui/code-input";
import { DateField } from "@/components/ui/date-field";
import { FileField } from "@/components/ui/file-field";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { PillFilter } from "@/components/ui/pill-filter";
import { QuickFilters } from "@/components/ui/quick-filters";
import { SearchBox } from "@/components/ui/search-box";
import { RadioCard } from "@/components/ui/radio-card";
import { Stat } from "@/components/ui/stat";
import { SummaryBox } from "@/components/ui/summary-box";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";

// Vitrine só de desenvolvimento (D5): textos de exemplo fixos; a rota só existe sob import.meta.env.DEV.
const VARIANTS = ["primary", "secondary", "ghost", "danger", "dangerSolid", "accent", "whatsapp"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const STATUSES = ["ACTIVE", "DUE_SOON", "OVERDUE", "IN_REVIEW", "PENDING", "BIRTHDAY_TODAY"];
const ROWS = [
  { id: "1", nome: "Ana Souza", valor: "R$ 120,00" },
  { id: "2", nome: "Bruno Lima", valor: "R$ 95,50" },
];
const COLUMNS = [
  { key: "nome", label: "Nome", sortable: true, render: (r: (typeof ROWS)[number]) => r.nome },
  { key: "valor", label: "Valor", numeric: true, render: (r: (typeof ROWS)[number]) => r.valor },
];

function Pieces({ theme, first }: { theme: string; first: boolean }) {
  const [on, setOn] = useState(true);
  const [code, setCode] = useState("48");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pill, setPill] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [panel, setPanel] = useState(false);
  const noop = () => {};
  return (
    <div className="flex flex-col gap-4">
      <Section heading="h2" title={`Botões (${theme})`} action={<Button variant="ghost" size="sm">Ação</Button>}>
        <div className="flex flex-wrap items-center gap-2">
          {VARIANTS.map((v) => (
            <Button key={v} variant={v}>{v}</Button>
          ))}
          {SIZES.map((s) => (
            <Button key={s} size={s} icon={<Download />}>{s}</Button>
          ))}
          <Button loading>Carregando</Button>
          <Button disabled disabledReason="Motivo de exemplo">Desabilitado</Button>
        </div>
      </Section>
      <Section heading="h2" title={`Selos e avisos (${theme})`}>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} label={s} />
          ))}
          <Badge tone="info">Bolsista</Badge>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {(["info", "warn", "danger", "ok"] as const).map((t) => (
            <Banner key={t} tone={t}>Aviso {t}</Banner>
          ))}
        </div>
      </Section>
      <Section heading="h2" title={`Números e pessoas (${theme})`}>
        <div className="flex flex-wrap items-center gap-4">
          <Stat label="Recebido" value="R$ 1.200" note="+10%" tone="ok" />
          <Avatar name="Ana Souza" />
          <Avatar name="Ana Souza" size="sm" />
          <ModalityDot name="Jiu-jitsu" />
          <GraduationBelt name="Preta" color="#111111" secondaryColor="#c00000" degree={2} label="Faixa preta · 2 graus" />
          <Person name="Bruno Lima" secondary="Faixa azul" />
        </div>
        <SummaryBox className="mt-3" items={["Cancela a cobrança", "Avisa o aluno"]} />
      </Section>
      <Section heading="h2" title={`Campos (${theme})`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" required hint="Como no documento" error="Campo obrigatório">
            {(c) => <Input {...c} defaultValue="Ana" />}
          </Field>
          <Field label="Faixa">
            {(c) => (
              <Select {...c}>
                <option>Branca</option>
                <option>Azul</option>
              </Select>
            )}
          </Field>
          <Field label="Observação">{(c) => <Textarea {...c} maxLength={100} />}</Field>
          <div className="flex flex-col gap-2">
            <Checkbox label="Caixa" />
            <Switch label="Chave" description="Explicação da chave" checked={on} onCheckedChange={setOn} />
            <DateField aria-label="Data" defaultValue="2026-11-09" />
            <FileField aria-label="Arquivo" />
            <CodeInput aria-label="Código" value={code} onChange={setCode} />
            <RadioCard name="plano" label="Mensal" description="Renova todo mês" defaultChecked />
            <RadioCard name="plano" label="Anual" />
          </div>
        </div>
      </Section>
      <Section heading="h2" title={`Tabela, abas e filtros (${theme})`}>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox className="min-w-48 flex-1" aria-label="Busca" placeholder="Nome, CPF, e-mail ou telefone" value={search} onChange={setSearch} />
          <PillFilter label="Modalidade" value={pill} onChange={setPill} allLabel="Todas" options={[{ id: "bjj", name: "Jiu-Jitsu" }, { id: "judo", name: "Judô" }]} />
          <PillFilter label="Nível" value="" onChange={noop} allLabel="Todos" options={[]} disabled />
        </div>
        <QuickFilters
          value={filter}
          onChange={setFilter}
          options={[{ key: "all", label: "Todos", count: 2 }, { key: "late", label: "Em atraso", count: 1 }, { key: "blocked", label: "Bloqueados", soon: true }]}
        />
        <DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} order="nome" onOrder={noop} selectable selected={selected} onSelectionChange={setSelected} />
        <ul className="flex max-w-sm flex-col gap-3">
          <li className="rounded-md border p-3">
            <RowCard
              lead={<Avatar name="Ana Souza" decorative size="sm" />}
              title="Ana Souza"
              meta={<><ModalityDot name="Jiu-Jitsu" /><span>Centro, Norte</span><span>3 turmas</span></>}
              badge={<StatusBadge status="ACTIVE" label="Ativo" />}
              action={<Button variant="secondary">Ver</Button>}
            />
          </li>
        </ul>
        {first && <CanvasPagination page={1} pages={6} total={131} size={25} onPage={noop} onSize={noop} />}
        <Tabs
          label="Exemplo"
          tabs={[
            { id: "a", label: "Dados", content: <p>Primeira aba</p> },
            { id: "b", label: "Histórico", content: <p>Segunda aba</p> },
          ]}
        />
        <Stepper
          onFinish={noop}
          steps={[
            { id: "1", title: `Um ${theme}`, valid: true, content: <p>Primeira</p> },
            { id: "2", title: `Dois ${theme}`, valid: true, content: <p>Segunda</p> },
          ]}
        />
      </Section>
      <Section heading="h2" title={`Moldura da gestão (${theme})`}>
        <div className="flex flex-wrap items-center gap-4">
          <BrandMark org="Academia Leão" />
          <UnitMenu status="ready" units={[{ id: "a", name: "Tijuca" }, { id: "b", name: "Barra" }]} allUnits selected="a" onSelect={noop} onRetry={noop} />
        </div>
      </Section>
      <Section heading="h2" title={`Janelas (${theme})`}>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setModal(true)}>Abrir janela</Button>
          <Button variant="secondary" onClick={() => setConfirm(true)}>Abrir confirmação</Button>
          <Button variant="secondary" onClick={() => setPanel(true)}>Abrir painel</Button>
        </div>
        <Modal open={modal} onOpenChange={setModal} title="Janela" footer={<Button onClick={() => setModal(false)}>Salvar</Button>}>
          <p>Conteúdo</p>
        </Modal>
        <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Desativar" summary="Vai desativar." summaryItems={["Encerra matrículas"]} typedText="DESATIVAR" onConfirm={noop} />
        <SidePanel open={panel} onOpenChange={setPanel} title="Ficha" tabs={[{ id: "a", label: "Dados", content: <p>Dados</p> }]} />
      </Section>
      <Section heading="h2" title={`Quatro estados (${theme})`}>
        <LoadingState />
        <EmptyState title="Vazio" text="Nada aqui" action={<Button>Criar</Button>} />
        <ErrorState onRetry={noop} />
        <ForbiddenState />
      </Section>
    </div>
  );
}

export default function Vitrine() {
  return (
    <main data-vitrine className="min-h-screen bg-background p-4 text-foreground">
      <PageHeader title="Vitrine" subtitle="Peças do canvas nos dois temas (só desenvolvimento)" />
      {[
        ["Tema claro", ""],
        ["Tema escuro", "dark"],
      ].map(([name, cls]) => (
        <Card key={name} title={name} heading="h2" className="mt-4">
          <div className={`${cls} rounded-card bg-background p-4 text-foreground`}>
            <Pieces theme={name} first={!cls} />
          </div>
        </Card>
      ))}
    </main>
  );
}
