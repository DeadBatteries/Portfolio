Durante uma análise de segurança autorizada sobre minha própria conta acadêmica, identifiquei uma possível falha de Broken Access Control em uma plataforma de conteúdo educacional de terceiros utilizada pela instituição.

O problema permitia que identificadores associados a conteúdos fossem alterados diretamente na URL, possibilitando o acesso a materiais pertencentes a outras disciplinas sem uma aparente validação de autorização.

Também foram identificados endpoints de API relacionados aos mesmos identificadores que retornavam informações estruturais dos conteúdos.

Impacto potencial: exposição não autorizada de conteúdos educacionais.

Classificação: Broken Access Control / IDOR
CWE: CWE-639 — Authorization Bypass Through User-Controlled Key
Status: Reportado ao responsável em 01/09/2026.

Por responsabilidade, os identificadores válidos, conteúdos e detalhes que permitiriam reproduzir a enumeração não são publicados neste relatório.