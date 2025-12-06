​🚜 Meu Turno App – Gestão Inteligente de Campo (v2.0)

>​Meu Turno é um sistema PWA (Progressive Web App) Offline-First de alta performance, desenvolvido para a gestão completa de manutenção e apontamentos em operações florestais e agrícolas. A aplicação garante a integridade de dados mesmo em áreas remotas e sem conectividade, combinando a velocidade do armazenamento local (IndexedDB) com a segurança da sincronização em nuvem (Firebase).
​Projetado para a realidade do campo: funciona 100% offline, sincroniza silenciosamente quando há sinal e oferece uma interface moderna e intuitiva.

​🚀 Principais Funcionalidades

​1. Operacional & Apontamento
​Linha do Tempo Visual: Interface de apontamento diário estilo "timeline" para registro rápido e sequencial de atividades manuais e mecânicas.
​Gestão de Turno: Abertura dinâmica de turnos com seleção inteligente de Fazendas, Frentes e Equipes (sincronizadas do banco de dados).
​Ordem de Serviço (O.S.): Geração automática de O.S. com controle de status (Pendente/Finalizada), registro de falhas operacionais e classificação de manutenção (Corretiva, Preventiva, Melhoria).

​2. Gestão de Ativos & Catálogos
​Catálogo de Peças: Importação em massa de peças via Excel (.xlsx), busca rápida offline e gestão de itens utilizados na manutenção.
​Controle de Frotas: Cadastro e gestão de Máquinas Principais, Implementos e Caminhões de Apoio, com controle de horímetro.
​Sincronização Híbrida: O sistema decide automaticamente quando ler do dispositivo (para velocidade instantânea) ou buscar na nuvem (para dados atualizados).

​3. Relatórios & Inteligência
​Relatório Final Automatizado: Geração instantânea do resumo do turno com cálculo preciso de horas planejadas vs. horas paradas e % de DM (Disponibilidade Mecânica).
​Exportação Profissional: Gera o apontamento em formatos prontos para envio: PDF ou Imagem (JPG), otimizados para compartilhamento via WhatsApp.
​Dashboard Estatístico: Gráficos interativos (Chart.js) para análise de volume de O.S. e performance da equipe nos últimos 15 dias.

​4. Infraestrutura & Segurança
​Update Inteligente: Sistema de distribuição de versão "Sob Demanda" (estilo App Nativo), garantindo que o colaborador não perca dados não salvos durante uma atualização do sistema.
​Backup Robusto: Backup automático na nuvem (Firestore) e opção de backup/restauração manual completo via arquivo JSON.
​Exclusão Segura: Ferramentas administrativas para limpeza de histórico por Dia ou Mês, com travas de segurança e validação de contexto (Frente/Turno).

​🛠️ Tecnologias Utilizadas

​Frontend: HTML5, CSS3, JavaScript (Vanilla ES6+)
​Estilização: Tailwind CSS (UI Moderna e Responsiva)
​Banco de Dados (Arquitetura Híbrida):
​Local: IndexedDB (Armazenamento persistente de grande volume para funcionamento offline).
​Nuvem: Google Firebase Firestore (Sincronização em tempo real e backup).
​PWA Core: Service Workers customizados com estratégia NetworkFirst (para HTML) e CacheFirst (para Assets), garantindo acesso instantâneo sem internet.
​Bibliotecas Integradas:
​Chart.js (Visualização de Dados)
​SheetJS (Processamento de Excel)
​jsPDF (Geração de Relatórios)

​📈 Status do Projeto

​Versão: 2.0 (Stable)
​Arquitetura: Offline-First (Totalmente funcional em Modo Avião).
​Pronto para: Operações de campo críticas, gestão de frotas médias e grandes, uso colaborativo com sincronização automática entre dispositivos da mesma frente.

​Desenvolvido por: ROGERIOBNR © 2025