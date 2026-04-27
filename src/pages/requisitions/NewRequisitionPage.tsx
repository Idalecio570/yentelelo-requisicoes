import { PageWrapper } from "@/components/layout/PageWrapper"
import { Breadcrumb } from "@/components/shared/Breadcrumb"
import { RequisitionWizard } from "@/components/requisitions/RequisitionWizard"

export function NewRequisitionPage() {
  return (
    <PageWrapper
      titulo="Nova Requisição"
      breadcrumb={
        <Breadcrumb
          items={[
            { label: "Requisições", href: "/requisitions" },
            { label: "Nova Requisição" },
          ]}
        />
      }
    >
      <RequisitionWizard />
    </PageWrapper>
  )
}
