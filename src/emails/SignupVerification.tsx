import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import {
  BRAND_ON_PRIMARY,
  BRAND_PRIMARY,
  BRAND_PRIMARY_LIGHT,
  BRAND_SURFACE_LIGHT,
} from '@/lib/brandColors'
import { correctBoxShadow } from 'framer-motion'

type SignupVerificationProps = {
  username: string
  code: string
  appUrl: string
  expiresMinutes: number
}

function splitCode(code: string) {
  return code.padStart(6, '0').split('')
}

export default function SignupVerification({
  username,
  code,
  appUrl,
  expiresMinutes,
}: SignupVerificationProps) {
  const digits = splitCode(code)

  return (
    <Html>
      <Head />
      <Preview>Seu código de verificação Kivora English: {code}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.hero}>
            <Img
              src={`${appUrl}/brand/kivora-mark.png`}
              width="72"
              height="72"
              alt="Kivora English"
              style={styles.logo}
            />
            <Text style={styles.brandName}>Kivora English</Text>
            <Text style={styles.brandTagline}>Aprenda inglês com prática guiada todos os dias</Text>
          </Section>

          <Section style={styles.card}>
            <Heading style={styles.title}>Confirme sua conta</Heading>
            <Text style={styles.lead}>
              Olá, <strong>{username}</strong>. Use o código abaixo no site para concluir seu cadastro.
            </Text>

            <Section style={styles.codePanel}>
              <Row>
                {digits.map((digit, index) => (
                  <Column key={`${digit}-${index}`} style={styles.codeCell}>
                    <Text style={styles.codeDigit}>{digit}</Text>
                  </Column>
                ))}
              </Row>
            </Section>

            <Text style={styles.hint}>
              Este código expira em {expiresMinutes} minutos. Se você não solicitou este cadastro, ignore este email.
            </Text>
          </Section>

          <Section style={styles.footerCard}>
            <Text style={styles.footerTitle}>Kivora English</Text>
            <Text style={styles.footerCopy}>
              Rotina clara, prática diária e progresso visível em um só lugar.
            </Text>
          </Section>

          <Hr style={styles.hr} />
          <Text style={styles.legal}>© {new Date().getFullYear()} Kivora English</Text>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    margin: 0,
    backgroundColor: BRAND_SURFACE_LIGHT,
    color: '#18201d',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: '620px',
    margin: '0 auto',
    padding: '28px 16px',
  },
  hero: {
    textAlign: 'center' as const,
    padding: '34px 28px',
    backgroundColor: BRAND_PRIMARY,
    borderRadius: '24px 24px 0 0',
    border: `1px solid ${BRAND_PRIMARY}`,
  },
  logo: {
    margin: '0 auto 16px',
    borderRadius: '18px',
    display: 'block',
  },
  brandName: {
    margin: 0,
    color: BRAND_ON_PRIMARY,
    fontSize: '28px',
    lineHeight: '32px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  brandTagline: {
    margin: '10px 0 0',
    color: 'rgba(247, 248, 239, 0.82)',
    fontSize: '14px',
    lineHeight: '22px',
  },
  card: {
    padding: '30px 28px 32px',
    backgroundColor: '#ffffff',
    border: '1px solid #dce3df',
    borderTop: 'none',
    borderRadius: '0 0 24px 24px',
    boxShadow: '0 24px 70px rgba(28, 25, 21, 0.12)',
  },
  title: {
    margin: '0 0 12px',
    color: '#18201d',
    fontSize: '24px',
    lineHeight: '30px',
    fontWeight: 800,
  },
  lead: {
    margin: '0 0 24px',
    color: '#45524d',
    fontSize: '16px',
    lineHeight: '26px',
  },
  codePanel: {
    margin: '0 0 22px',
    padding: '18px 12px',
    backgroundColor: BRAND_PRIMARY_LIGHT,
    borderRadius: '18px',
    border: `1px solid rgba(28, 25, 21, 0.12)`,
  },
  codeCell: {
    width: '16.66%',
    textAlign: 'center' as const,
    padding: '0 4px',
  },
  codeDigit: {
    margin: 0,
    padding: '14px 0',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    color: BRAND_PRIMARY,
    fontSize: '30px',
    lineHeight: '34px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    border: `1px solid rgba(28, 25, 21, 0.08)`,
    boxShadow: '0 10px 24px rgba(28, 25, 21, 0.08)',
  },
  hint: {
    margin: 0,
    color: '#71807a',
    fontSize: '14px',
    lineHeight: '22px',
  },
  footerCard: {
    marginTop: '18px',
    padding: '20px 24px',
    backgroundColor: '#ffffff',
    border: '1px solid #dce3df',
    borderRadius: '18px',
    textAlign: 'center' as const,
  },
  footerTitle: {
    margin: '0 0 6px',
    color: BRAND_PRIMARY,
    fontSize: '16px',
    fontWeight: 800,
  },
  footerCopy: {
    margin: 0,
    color: '#71807a',
    fontSize: '13px',
    lineHeight: '20px',
  },
  hr: {
    borderColor: '#dce3df',
    margin: '24px 0 12px',
  },
  legal: {
    margin: 0,
    color: '#9aa59f',
    fontSize: '12px',
    textAlign: 'center' as const,
  },
}