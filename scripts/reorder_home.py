import re

with open('src/app/(dashboard)/home/page.tsx', 'r') as f:
    content = f.read()

# We want to replace everything from `return (` to the end of the file.
# Let's find `return (\n    <div className="space-y-8 pb-20 animate-fade-in">`
start_idx = content.find('  return (\n    <div className="space-y-8 pb-20 animate-fade-in">')

if start_idx == -1:
    print("Could not find return block")
    exit(1)

imports_and_logic = content[:start_idx]

new_return_block = """  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <HomeRealtime />

      {/* 1. HERO SECTION */}
      <section
        className="bg-[var(--color-surface-container-lowest)] rounded-[2rem] p-8 md:p-12 editorial-shadow ghost-border flex flex-col justify-between relative overflow-hidden animate-slide-up"
      >
        <div className="section-kicker">English flow for today</div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-responsive-lg font-semibold text-[var(--color-text)]">
              Seu inglês fica mais afiado quando a rotina fica mais gostosa de abrir.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
              Olá, {profile?.username || 'estudante'}.{' '}
              {pendingCount > 0
                ? `Você tem ${pendingCount} ${pendingCount === 1 ? 'lição pendente' : 'lições pendentes'} para manter o ritmo hoje.`
                : 'Seu plano do dia está concluído. Aproveite para revisar e consolidar o vocabulário.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {profile?.role === 'admin' && (
              <Link
                href="/admin/dashboard"
                transitionTypes={navForwardTransitionTypes}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(43,122,11,0.16)] bg-[linear-gradient(135deg,rgba(223,236,205,0.96),rgba(211,230,187,0.9))] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] shadow-[0_18px_36px_-24px_rgba(43,122,11,0.34)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(43,122,11,0.12)] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]">
                  <Settings className="h-4 w-4" strokeWidth={2.3} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)]/70">
                    Admin
                  </span>
                  <span className="font-bold text-[var(--color-primary)]">Painel</span>
                </span>
              </Link>
            )}
            <StreakBadge count={streak} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {reviewStats.totalDue > 0 ? (
            <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-primary">
              <Brain className="h-4 w-4" strokeWidth={2} />
              Iniciar revisão
            </Link>
          ) : (
            <Link href="/history" transitionTypes={navForwardTransitionTypes} className="btn-primary">
              <BarChart3 className="h-4 w-4" strokeWidth={2} />
              Ver histórico
            </Link>
          )}

          {pendingCount === 0 && totalAssignments > 0 && (
            <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-ghost">
              <Clock className="h-4 w-4" strokeWidth={2} />
              Revisar tarefas
            </Link>
          )}

          {nextAssignment && (
            <Link href={`/play/${nextAssignment.id}`} transitionTypes={navForwardTransitionTypes} className="btn-ghost">
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
              Continuar lição
            </Link>
          )}
        </div>
      </section>

      {/* 2. ACHIEVEMENTS */}
      {achievements.length > 0 && (
        <section className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '40ms' }}>
          {achievements.map((achievement) => {
            const Icon = achievement.icon
            return (
              <div
                key={achievement.id}
                title={achievement.description}
                className={`flex items-center gap-2.5 rounded-full border px-4 py-2 transition-all hover:scale-105 ${achievement.className}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                <p className="text-xs font-bold">{achievement.label}</p>
              </div>
            )
          })}
        </section>
      )}

      {/* 3. PRIMARY ACTION: ASSIGNMENTS (TAREFAS DO DIA) */}
      <section className="space-y-4 animate-slide-up" style={{ animationDelay: '60ms' }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Daily assignments</p>
            <h2 className="mt-4 text-4xl font-semibold text-[var(--color-text)]">Tarefas do dia</h2>
          </div>
          <div className="rounded-full border border-[var(--color-border)] bg-white/72 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
            {completedCount} de {totalAssignments} concluído{totalAssignments === 1 ? '' : 's'}
          </div>
        </div>

        {assignments.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {assignments.map((assignment, index) => {
              const statusMeta = parseAssignmentStatus(assignment.status)
              const mode = gameModeConfig[assignment.game_mode] || gameModeConfig.multiple_choice
              const level = assignment.packs?.level || 'easy'
              const difficulty = difficultyConfig[level] || difficultyConfig.easy
              const Icon = mode.icon
              const isCompleted = isAssignmentCompleted(assignment.status)
              const isIncomplete = isAssignmentIncomplete(assignment.status)

              return (
                <article
                  key={assignment.id}
                  data-testid="assignment-card"
                  className={`bg-[var(--color-surface-container-lowest)] ghost-border rounded-[2rem] flex flex-col justify-between p-8 editorial-shadow animate-slide-up ${isCompleted ? 'border-[var(--color-border)] bg-[var(--color-surface-container-low)]' : ''}`}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`badge ${difficulty.className}`}>{difficulty.label}</span>
                          <span className="badge border border-[var(--color-border)] bg-white/70 text-[var(--color-text-muted)]">
                            {mode.label}
                          </span>
                          {statusMeta.timeLimitMinutes && (
                            <span className="badge border border-[rgba(43,122,11,0.14)] bg-[rgba(43,122,11,0.06)] text-[var(--color-primary)]">
                              {statusMeta.timeLimitMinutes} min
                            </span>
                          )}
                        </div>

                        <h3 className="mt-5 text-3xl font-semibold leading-[1.02] text-[var(--color-text)]">
                          {assignment.packs?.name}
                        </h3>

                        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                          {assignment.packs?.description || 'Sessão preparada para manter a consistência do seu inglês.'}
                        </p>
                      </div>

                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${isCompleted ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'}`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-7 w-7" strokeWidth={1.8} />
                        ) : (
                          <Icon className="h-7 w-7" strokeWidth={1.8} />
                        )}
                      </div>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      <div className="bg-[var(--color-surface-container)] rounded-xl p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          Status
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                          {isCompleted ? 'Concluído' : isIncomplete ? 'Incompleto' : 'Pronto para jogar'}
                        </p>
                      </div>
                      <div className="bg-[var(--color-surface-container)] rounded-xl p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          Modo
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{mode.label}</p>
                      </div>
                      <div className="bg-[var(--color-surface-container)] rounded-xl p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          {statusMeta.timeLimitMinutes ? 'Tempo' : 'Foco'}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                          {statusMeta.timeLimitMinutes
                            ? `${statusMeta.timeLimitMinutes} min`
                            : level === 'easy'
                              ? 'Base'
                              : level === 'medium'
                                ? 'Ritmo'
                                : 'Desafio'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7">
                    {!isCompleted ? (
                      <Link
                        href={`/play/${assignment.id}`}
                        transitionTypes={navForwardTransitionTypes}
                        data-testid="assignment-start-button"
                        className={`w-full py-4 ${isIncomplete ? 'btn-ghost' : 'btn-primary'}`}
                      >
                        {isIncomplete ? 'Continuar treinamento' : 'Iniciar treinamento'}
                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
                      </Link>
                    ) : (
                      <div
                        className="flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white"
                        style={{ backgroundColor: '#2B7A0B' }}
                      >
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                        Concluído
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] editorial-shadow ghost-border rounded-[2rem] p-10 text-center md:p-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-container)] text-[var(--color-text)]">
              <BookOpen className="h-9 w-9" strokeWidth={1.7} />
            </div>
            <h2 className="mt-6 text-4xl font-semibold text-[var(--color-text)]">Tudo certo por hoje.</h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
              O administrador ainda não atribuiu novas lições. Se quiser manter o ritmo, use a revisão ou abra o histórico.
            </p>
          </div>
        )}
      </section>

      {/* 4. SPACED REPETITION / REVIEW */}
      {reviewStats.totalDue > 0 && (
        <section
          className="bg-[var(--color-surface-container)] p-8 md:p-12 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 editorial-shadow animate-slide-up"
          style={{ animationDelay: '80ms' }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between w-full">
            <div className="flex items-start gap-4">
              <div className="icon-glow flex h-14 w-14 items-center justify-center rounded-[22px] text-[var(--color-primary)]">
                <Brain className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <div className="max-w-xl">
                <p className="section-kicker">Revisão espaçada</p>
                <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                  Hora de consolidar a memória.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
                  Você tem {reviewStats.dueToday} revisões vencidas e {reviewStats.newCards} novos cards.
                </p>
              </div>
            </div>

            <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-primary shrink-0">
              Começar revisão
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </section>
      )}

      {/* 5. GAMIFICATION & STATS */}
      <MissionBoard state={missionState} showPulse={showMissionPulse} />
      
      {profile?.role !== 'admin' && (
        <PwaCoach dueCount={reviewStats.totalDue} pendingCount={pendingCount} />
      )}
      
      <MotivationalCarousel />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="card p-6">
          <p className="section-kicker">Daily goal</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--color-text)]">
                {dailyGoalCompleted}/{dailyGoalTarget || 1}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                Feche as tarefas do dia e zere as revisões para completar a missão.
              </p>
            </div>
            <span className="badge border border-[var(--color-border)] bg-white/72 text-[var(--color-text-muted)]">
              {dailyGoalProgress}% concluído
            </span>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[rgba(17,32,51,0.08)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-secondary))] transition-all duration-500"
              style={{ width: `${dailyGoalProgress}%` }}
            />
          </div>
        </div>

        <div className="card p-6">
          <p className="section-kicker">Weekly score</p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--color-text)]">{weeklyFocusScore}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                Pontos por consistência e acertos (7 dias).
              </p>
            </div>
            <span className="inline-flex rounded-full bg-[var(--color-primary-light)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]">
              {focusRank}
            </span>
          </div>
        </div>
      </section>

      {/* 6. ADAPTIVE COACH & WEAKNESSES */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] animate-slide-up" style={{ animationDelay: '120ms' }}>
        <AdaptiveCoachPanel plan={coachPlan} />
        
        <div className="space-y-6">
          <div className="card p-6">
            <p className="section-kicker">Pontos fracos</p>
            <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text)]">
              {topWeakCards[0]?.en || 'Sem padrão forte'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {topWeakCards[0]
                ? `${topWeakCards[0].pt} apareceu ${topWeakCards[0].count}x nos erros recentes.`
                : 'Os erros recentes ainda não formaram um ponto fraco dominante.'}
            </p>
            <Link href="/problem-words" transitionTypes={navForwardTransitionTypes} className="btn-ghost mt-5 w-full">
              <Target className="h-4 w-4" strokeWidth={2} />
              Palavras problemáticas
            </Link>
          </div>

          <div className="card p-6">
            <p className="section-kicker">Semana</p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
              {cardsMasteredThisWeek}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              cards com revisão boa nesta semana.
            </p>
          </div>
        </div>
      </div>

      {/* 7. WEEKLY RANKING */}
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] animate-slide-up" style={{ animationDelay: '140ms' }}>
        <div className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Weekly ranking</p>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                Ranking da equipe
              </h2>
            </div>
            <span className="badge border border-[var(--color-border)] bg-white/72 text-[var(--color-text-muted)]">
              7 dias
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {topLeaderboard.length > 0 ? (
              topLeaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between gap-4 rounded-[20px] border px-4 py-3 ${
                    entry.userId === user.id
                      ? 'border-[var(--color-primary)] bg-[rgba(43,122,11,0.08)]'
                      : 'border-[var(--color-border)] bg-white/76'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container)] text-sm font-bold text-[var(--color-text)]">
                      #{entry.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--color-text)]">
                        {entry.username}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {entry.sessions} sessões · {entry.accuracy}% de precisão
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                    {entry.score} pts
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Quando a equipe acumular sessões nesta semana, o ranking aparece aqui.
              </p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <p className="section-kicker">Sua posição</p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
            {currentUserLeaderboardEntry ? `#${currentUserLeaderboardEntry.rank}` : 'Sem posição'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {currentUserLeaderboardEntry
              ? `${currentUserLeaderboardEntry.score} pontos nesta semana. Faixa ${getLeaderboardTier(currentUserLeaderboardEntry.score)}.`
              : 'Ainda não há sessões suficientes para entrar no ranking semanal.'}
          </p>
          {currentUserLeaderboardEntry && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Pontos
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                  {currentUserLeaderboardEntry.score}
                </p>
              </div>
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Precisão
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                  {currentUserLeaderboardEntry.accuracy}%
                </p>
              </div>
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Melhor streak
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                  {currentUserLeaderboardEntry.bestStreak}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
"""

with open('src/app/(dashboard)/home/page.tsx', 'w') as f:
    f.write(imports_and_logic + new_return_block)

print("Home page layout reordered successfully.")
