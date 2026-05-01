import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Text,
} from "@react-email/components";

export interface DunningProps {
  memberName: string;
  amountFormatted: string;
  planName: string;
  attemptCount: number;
  updatePaymentUrl: string;
}

export function Dunning({
  memberName,
  amountFormatted,
  planName,
  attemptCount,
  updatePaymentUrl,
}: DunningProps) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily: "Inter, sans-serif",
          background: "#fafaf9",
          color: "#1a1a1a",
          padding: 24,
        }}
      >
        <Container
          style={{ background: "#ffffff", padding: 24, borderRadius: 12 }}
        >
          <Heading style={{ color: "#dc2626" }}>Payment failed</Heading>
          <Text>Hi {memberName},</Text>
          <Text>
            We weren't able to charge your card for <strong>{planName}</strong>{" "}
            ({amountFormatted}). This is attempt #{attemptCount}.
          </Text>
          <Section>
            <Text>
              Please update your payment method to keep your membership active —
              we'll retry automatically once it's saved.
            </Text>
            <Button
              href={updatePaymentUrl}
              style={{
                background: "#1a1a1a",
                color: "#ffffff",
                padding: "12px 20px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Update payment method
            </Button>
          </Section>
          <Text style={{ marginTop: 24, color: "#6b7280", fontSize: 12 }}>
            Reply to this email if you need help.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
