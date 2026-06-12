import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'

type WeeklyReportProps = {
  username?: string | null
  periodLabel: string
  cardsStudied: number
  accuracy: number
  currentStreak: number
  estimatedMinutes: number
  level: string
  levelProgress: number
  appUrl: string
  unsubscribeUrl: string
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours <= 0) return `${minutes}min`
  if (minutes <= 0) return `${hours}h`
  return `${hours}h ${minutes}min`
}

function getMotivationalMessage(accuracy: number, cardsStudied: number) {
  if (cardsStudied <= 0 || accuracy < 50) {
    return 'Sentimos sua falta essa semana. Que tal retomar hoje?'
  }

  if (accuracy > 80) {
    return 'Semana excelente! Continue assim.'
  }

  return 'Boa semana. Você está evoluindo.'
}

export default function WeeklyReport({
  username,
  periodLabel,
  cardsStudied,
  accuracy,
  currentStreak,
  estimatedMinutes,
  level,
  levelProgress,
  appUrl,
  unsubscribeUrl,
}: WeeklyReportProps) {
  const safeProgress = Math.max(0, Math.min(100, levelProgress))
  const message = getMotivationalMessage(accuracy, cardsStudied)

  return (
    <Html>
      <Head />
      <Preview>Seu relatório semanal Kivora English</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src={`${appUrl}/icon-192.png`}
              width="48"
              height="48"
              alt="Kivora English"
              style={styles.logo}
            />
            <Heading style={styles.title}>Seu relatório semanal 📊</Heading>
            <Text style={styles.period}>Período: {periodLabel}</Text>
          </Section>

          <Section style={styles.highlight}>
            <Text style={styles.muted}>Cards estudados essa semana</Text>
            <Text style={styles.bigNumber}>{cardsStudied}</Text>
            {username ? <Text style={styles.muted}>Bom trabalho, {username}.</Text> : null}
          </Section>

          <Section style={styles.metrics}>
            <Row>
              <Column style={styles.metricColumn}>
                <Text style={styles.metricValue}>{accuracy}%</Text>
                <Text style={styles.metricLabel}>Precisão</Text>
              </Column>
              <Column style={styles.metricColumn}>
                <Text style={styles.metricValue}>{currentStreak}</Text>
                <Text style={styles.metricLabel}>Streak atual</Text>
              </Column>
              <Column style={styles.metricColumn}>
                <Text style={styles.metricValue}>{formatMinutes(estimatedMinutes)}</Text>
                <Text style={styles.metricLabel}>Tempo estimado</Text>
              </Column>
            </Row>
          </Section>

          <Section style={styles.progressSection}>
            <Text style={styles.levelText}>Você está no nível {level}</Text>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${safeProgress}%` }} />
            </div>
          </Section>

          <Section style={styles.messageBox}>
            <Text style={styles.message}>{message}</Text>
          </Section>

          <Section style={styles.ctaWrap}>
            <Button href={appUrl} style={styles.button}>
              Continuar estudando →
            </Button>
          </Section>

          <Hr style={styles.hr} />

          <Section>
            <Text style={styles.footer}>Kivora English — kivora.dev@outlook.com</Text>
            <Link href={unsubscribeUrl} style={styles.footerLink}>
              Cancelar relatório semanal
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    margin: 0,
    backgroundColor: '#f7f8f6',
    color: '#18201d',
    fontFamily: 'Arial, sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: '620px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  header: {
    textAlign: 'center' as const,
    padding: '28px 24px',
    backgroundColor: '#ffffff',
    border: '1px solid #dce3df',
    borderRadius: '16px',
  },
  logo: {
    margin: '0 auto 14px',
    borderRadius: '12px',
  },
  title: {
    margin: '0',
    color: '#18201d',
    fontSize: '28px',
    lineHeight: '34px',
  },
  period: {
    margin: '10px 0 0',
    color: '#71807a',
    fontSize: '14px',
  },
  highlight: {
    marginTop: '18px',
    padding: '28px 24px',
    backgroundColor: '#ffffff',
    border: '1px solid #dce3df',
    borderRadius: '16px',
    textAlign: 'center' as const,
  },
  muted: {
    margin: 0,
    color: '#45524d',
    fontSize: '14px',
  },
  bigNumber: {
    margin: '10px 0',
    color: '#065f46',
    fontSize: '64px',
    lineHeight: '70px',
    fontWeight: 800,
  },
  metrics: {
    marginTop: '18px',
    padding: '18px 12px',
    backgroundColor: '#ffffff',
    border: '1px solid #dce3df',
    borderRadius: '16px',
  },
  metricColumn: {
    width: '33.33%',
    textAlign: 'center' as const,
    padding: '8px',
  },
  metricValue: {
    margin: 0,
    color: '#18201d',
    fontSize: '22px',
    fontWeight: 800,
  },
  metricLabel: {
    margin: '6px 0 0',
    color: '#71807a',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
  },
  progressSection: {
    marginTop: '18px',
    padding: '22px 24px',
    backgroundColor: '#ffffff',
    border: '1px solid #dce3df',
    borderRadius: '16px',
  },
  levelText: {
    margin: '0 0 12px',
    color: '#18201d',
    fontSize: '16px',
    fontWeight: 700,
  },
  progressTrack: {
    height: '12px',
    overflow: 'hidden',
    backgroundColor: '#edf2ef',
    borderRadius: '999px',
  },
  progressFill: {
    height: '12px',
    backgroundColor: '#065f46',
    borderRadius: '999px',
  },
  messageBox: {
    marginTop: '18px',
    padding: '20px 24px',
    backgroundColor: '#e9f6f2',
    borderRadius: '16px',
  },
  message: {
    margin: 0,
    color: '#12352e',
    fontSize: '16px',
    fontWeight: 700,
    textAlign: 'center' as const,
  },
  ctaWrap: {
    textAlign: 'center' as const,
    padding: '26px 0 8px',
  },
  button: {
    backgroundColor: '#065f46',
    borderRadius: '999px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 800,
    padding: '14px 22px',
    textDecoration: 'none',
  },
  hr: {
    borderColor: '#dce3df',
    margin: '24px 0',
  },
  footer: {
    margin: '0 0 8px',
    color: '#71807a',
    fontSize: '12px',
    textAlign: 'center' as const,
  },
  footerLink: {
    display: 'block',
    color: '#065f46',
    fontSize: '12px',
    textAlign: 'center' as const,
  },
}
