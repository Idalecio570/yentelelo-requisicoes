import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"

// Layout & guards
import { MainLayout }      from "@/components/layout/MainLayout"
import { ProtectedRoute }  from "@/components/shared/ProtectedRoute"

// Páginas públicas
import { LoginPage }        from "@/pages/auth/LoginPage"
import { UnauthorizedPage } from "@/pages/auth/UnauthorizedPage"
import { NotFoundPage }     from "@/pages/auth/NotFoundPage"

// Páginas protegidas — qualquer autenticado
import { DashboardPage }        from "@/pages/dashboard/DashboardPage"
import { RequisitionsPage }     from "@/pages/requisitions/RequisitionsPage"
import { NewRequisitionPage }   from "@/pages/requisitions/NewRequisitionPage"
import { RequisitionDetailPage } from "@/pages/requisitions/RequisitionDetailPage"
import { EditRequisitionPage }   from "@/pages/requisitions/EditRequisitionPage"
import { SuppliersPage }        from "@/pages/suppliers/SuppliersPage"
import { SupplierDetailPage }   from "@/pages/suppliers/SupplierDetailPage"
import { ProfilePage }          from "@/pages/profile/ProfilePage"

// Páginas com role específico
import { ApprovalsPage }  from "@/pages/approvals/ApprovalsPage"
import { PaymentsPage }   from "@/pages/payments/PaymentsPage"
import { ReportsPage }    from "@/pages/reports/ReportsPage"
import { AdminPage }      from "@/pages/admin/AdminPage"
import { UsersPage }      from "@/pages/admin/UsersPage"
import { LimitsPage }     from "@/pages/admin/LimitsPage"
import { TemplatesPage }  from "@/pages/admin/TemplatesPage"
import { AuditPage }      from "@/pages/admin/AuditPage"

const router = createBrowserRouter([
  // -------------------------------------------------------------------------
  // Rotas públicas
  // -------------------------------------------------------------------------
  { path: "/login",        element: <LoginPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "*",             element: <NotFoundPage /> },

  // -------------------------------------------------------------------------
  // Rotas protegidas — qualquer utilizador autenticado
  // -------------------------------------------------------------------------
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard",        element: <DashboardPage /> },
          { path: "requisitions",     element: <RequisitionsPage /> },
          { path: "requisitions/:id", element: <RequisitionDetailPage /> },
          { path: "suppliers",        element: <SuppliersPage /> },
          { path: "suppliers/:id",    element: <SupplierDetailPage /> },
          { path: "profile",          element: <ProfilePage /> },

          // Criação e edição — auditor não tem acesso de escrita
          {
            element: <ProtectedRoute allowedRoles={["colaborador", "gestor_escritorio", "director_comercial", "director_projectos", "gestor_comercial", "gestor_tics", "director_geral", "admin"]} />,
            children: [
              { path: "requisitions/new",      element: <NewRequisitionPage /> },
              { path: "requisitions/:id/edit", element: <EditRequisitionPage /> },
            ],
          },

          // -----------------------------------------------------------------
          // Aprovações + Pagamentos → gestor_escritorio, director_geral, admin
          // -----------------------------------------------------------------
          {
            element: <ProtectedRoute allowedRoles={["gestor_escritorio", "director_geral", "admin"]} />,
            children: [
              { path: "approvals", element: <ApprovalsPage /> },
              { path: "payments",  element: <PaymentsPage /> },
            ],
          },

          // -----------------------------------------------------------------
          // Relatórios → gestor_escritorio, director_geral, admin, auditor
          // -----------------------------------------------------------------
          {
            element: <ProtectedRoute allowedRoles={["gestor_escritorio", "director_geral", "admin", "auditor"]} />,
            children: [
              { path: "reports", element: <ReportsPage /> },
            ],
          },

          // -----------------------------------------------------------------
          // Administração → admin
          // -----------------------------------------------------------------
          {
            element: <ProtectedRoute allowedRoles={["admin"]} />,
            children: [
              { path: "admin",        element: <AdminPage /> },
              { path: "admin/users",  element: <UsersPage /> },
              { path: "admin/limits", element: <LimitsPage /> },
            ],
          },

          // -----------------------------------------------------------------
          // Templates → admin, gestor_escritorio
          // -----------------------------------------------------------------
          {
            element: <ProtectedRoute allowedRoles={["admin", "gestor_escritorio"]} />,
            children: [
              { path: "admin/templates", element: <TemplatesPage /> },
            ],
          },

          // -----------------------------------------------------------------
          // Auditoria → admin, auditor
          // -----------------------------------------------------------------
          {
            element: <ProtectedRoute allowedRoles={["admin", "auditor"]} />,
            children: [
              { path: "admin/audit", element: <AuditPage /> },
            ],
          },
        ],
      },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
