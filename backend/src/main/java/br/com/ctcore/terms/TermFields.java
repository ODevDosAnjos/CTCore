package br.com.ctcore.terms;

import br.com.ctcore.mail.TextModels;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.jdbc.core.simple.JdbcClient;

/** RN-MAT-21: único lugar que monta os valores dos campos automáticos do termo de matrícula e os troca no texto. */
public final class TermFields {
    static final List<String> FIELDS = List.of("unidade", "razao_social", "cnpj", "endereco");
    static final String MISSING = "não informado";

    /** Valores prontos de uma unidade; {@code missing}: os campos sem dado, que saem "não informado". */
    public record UnitValues(UUID id, String name, Map<String, String> values, List<String> missing) {}

    private TermFields() {}

    /** 400 no campo {@code body}: campo desconhecido ou chave sem fecho. */
    static void validate(String text) {
        TextModels.checkFields(FIELDS, "body", text);
    }

    public static String fill(String text, UnitValues unit) {
        return TextModels.fill(text, unit.values());
    }

    /** Valores das unidades da organização, na ordem pedida. Exige a transação com o escopo da organização. */
    public static List<UnitValues> values(JdbcClient jdbc, UUID organizationId, List<UUID> unitIds) {
        if (unitIds.isEmpty()) return List.of();
        Map<UUID, UnitValues> found = jdbc.sql("select u.id, u.name, u.legal_name, u.cnpj, o.holder_name, o.holder_document, u.address, u.city, u.postal_code "
                + "from unit u join organization o on o.id = u.organization_id where u.organization_id = :org and u.id in (:ids)")
                .param("org", organizationId).param("ids", unitIds).query((rs, n) -> {
                    // Com CNPJ, razão social e documento são os da unidade; sem CNPJ, os do titular. Os dois nunca se misturam.
                    boolean own = !blank(rs.getString(4));
                    return of(rs.getObject(1, UUID.class), rs.getString(2), rs.getString(own ? 3 : 5), rs.getString(own ? 4 : 6),
                            address(rs.getString(7), rs.getString(8), rs.getString(9)));
                }).list().stream().collect(Collectors.toMap(UnitValues::id, Function.identity()));
        return unitIds.stream().map(found::get).filter(Objects::nonNull).toList();
    }

    private static UnitValues of(UUID id, String name, String legalName, String document, String address) {
        String[] raw = {name, legalName, document(document), address};
        var values = new LinkedHashMap<String, String>();
        var missing = new ArrayList<String>();
        for (int i = 0; i < raw.length; i++) {
            boolean empty = blank(raw[i]);
            values.put(FIELDS.get(i), empty ? MISSING : raw[i].strip());
            if (empty) missing.add(FIELDS.get(i));
        }
        return new UnitValues(id, name, values, missing);
    }

    private static String document(String d) {
        if (d == null) return null;
        if (d.length() == 14) return d.replaceAll("(.{2})(.{3})(.{3})(.{4})(.{2})", "$1.$2.$3/$4-$5");
        return d.length() == 11 ? d.replaceAll("(.{3})(.{3})(.{3})(.{2})", "$1.$2.$3-$4") : d;
    }

    private static String address(String street, String city, String postalCode) {
        String cep = postalCode != null && postalCode.length() == 8 ? postalCode.substring(0, 5) + "-" + postalCode.substring(5) : postalCode;
        return Stream.of(street, city, blank(cep) ? null : "CEP " + cep).filter(p -> !blank(p)).map(String::strip).collect(Collectors.joining(", "));
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
