import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'

type SubscriptionReminderProps = {
  username?: string | null
  renewalDate: string
  graceDate: string
  appUrl: string
}

export default function SubscriptionReminder({ username, renewalDate, graceDate, appUrl }: SubscriptionReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>Sua assinatura Pro está próxima da renovação</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.title}>Sua assinatura Pro está próxima do vencimento</Heading>
            <Text style={styles.text}>Olá{username ? `, ${username}` : ''}!</Text>
            <Text style={styles.text}>
              Sua próxima cobrança está prevista para <strong>{renewalDate}</strong>. Verifique seu método de pagamento para continuar usando todos os recursos Pro.
            </Text>
            <Button href={`${appUrl}/settings`} style={styles.button}>Ver minha assinatura</Button>
            <Text style={styles.muted}>
              Se o pagamento não for confirmado, você terá até {graceDate} para regularizar. Depois disso, a conta será automaticamente alterada para o plano Free.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: { backgroundColor: '#F4F1EA', color: '#1C1915', fontFamily: 'Arial, sans-serif', padding: '32px 0' },
  container: { backgroundColor: '#FFFFFF', border: '1px solid #1C1915', margin: '0 auto', maxWidth: '560px', padding: '32px' },
  header: { textAlign: 'left' as const },
  title: { fontSize: '26px', lineHeight: '1.2', margin: '0 0 24px' },
  text: { fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' },
  muted: { color: '#625E58', fontSize: '13px', lineHeight: '1.6', margin: '24px 0 0' },
  button: { backgroundColor: '#D5E06B', border: '1px solid #1C1915', color: '#1C1915', display: 'inline-block', fontSize: '14px', fontWeight: '700', padding: '12px 18px', textDecoration: 'none' },
}

