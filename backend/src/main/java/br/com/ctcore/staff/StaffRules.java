package br.com.ctcore.staff;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

/** RN-ORG-07: the last-administrator rule and unit set difference; pure, no database. */
final class StaffRules {
    private StaffRules() {}

    /** RN-ORG-07: the units, among those losing the administrator, where nobody else active remains. */
    static Set<UUID> leftWithoutAdministrator(Set<UUID> losing, Map<UUID, Integer> otherActiveAdministrators) {
        Set<UUID> left = new TreeSet<>();
        for (UUID unit : losing) {
            if (otherActiveAdministrators.getOrDefault(unit, 0) == 0) left.add(unit);
        }
        return left;
    }

    static Set<UUID> removed(Set<UUID> before, Set<UUID> after) {
        Set<UUID> result = new HashSet<>(before);
        result.removeAll(after);
        return result;
    }
}
