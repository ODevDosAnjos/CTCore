package br.com.ctcore.mail;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class EmailLayoutTest {
    @Test
    void buttonOnlyWithLink() {
        assertThat(EmailLayout.html("oi", "https://a/b", "Abrir")).contains("max-width:600px", "font-size:18px", "width:100%", "href=\"https://a/b\"");
        assertThat(EmailLayout.html("oi", null, "Abrir")).doesNotContain("<a ").contains("oi");
    }

    @Test
    @DisplayName("#754 CA4: o botão usa a cor da marca do ctcore, o rodapé traz feito com ctcore e o texto continua escapado pelo chamador")
    void brandColorAndFooter() {
        assertThat(EmailLayout.html("&lt;b&gt;", "https://a/b", "Abrir")).contains("background:#C8462C", "feito com ctcore", "&lt;b&gt;");
        assertThat(EmailLayout.html("oi", null, "Abrir")).contains("feito com ctcore").doesNotContain("<a ", "background:");
    }
}
