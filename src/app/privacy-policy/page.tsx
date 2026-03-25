import PolicyPage from "@/components/PolicyPage";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy policy"
      title="Privacy Policy"
      summary="This policy explains how customer, order, and enquiry data is collected and used across ordering, delivery, support, and restaurant operations."
      sections={[
        {
          heading: "Information we collect",
          paragraphs: [
            "We collect the information needed to process orders, provide delivery, answer support requests, and operate the admin dashboard. This may include names, email addresses, phone numbers, delivery addresses, order contents, and communication history.",
            "If you contact us through the website, we also process the details you choose to include in your enquiry so the team can respond appropriately.",
          ],
        },
        {
          heading: "How we use your data",
          paragraphs: [
            "We use personal data to fulfil orders, communicate about deliveries, manage restaurant operations, and improve the customer experience.",
            "We do not use contact details for unrelated marketing without a valid lawful basis or the required consent where applicable.",
          ],
        },
        {
          heading: "Retention and access requests",
          paragraphs: [
            "We keep data only for as long as reasonably necessary for order fulfilment, operational records, legal obligations, and customer service follow-up.",
            "Customers may contact support to request access, correction, or deletion of personal data, subject to any records we must retain for legal or financial reasons.",
          ],
        },
      ]}
    />
  );
}