import { useLocation, useNavigate, useParams } from "react-router";
import { StudentRecordPanel } from "./StudentRecordPanel";

// RF-ALU-03: ficha "Visão do Professor", aberta pela aula em gaveta sobre a agenda (a página-base vem da rota-pai);
// fechar volta à gaveta da aula, na mesma semana. A barreira é o servidor.
export function TeacherRecordPage() {
  const { id = "", studentId = "" } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  return <StudentRecordPanel id={studentId} onClose={() => navigate({ pathname: `/agenda/aulas/${id}`, search })} />;
}
