import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Text,
} from "@react-email/components";

export interface ReceiptProps {
  memberName: string;
  amountFormatted: string;
  planName: string;
  paidAt: string;
}

export function Receipt({
  memberName,
  amountFormatted,
  planName,
  paidAt,
}: ReceiptProps) {
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
          <Heading>Payment received</Heading>
          <Text>Hi {memberName},</Text>
          <Text>
            We've received your payment for <strong>{planName}</strong>.
          </Text>
          <Section>
            <Text>
              <strong>Amount:</strong> {amountFormatted}
            </Text>
            <Text>
              <strong>Date:</strong> {paidAt}
            </Text>
          </Section>
          <Text>Thanks for being a member.</Text>
        </Container>
      </Body>
    </Html>
  );
}
