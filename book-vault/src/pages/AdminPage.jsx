import DashboardLayoutBranding from "../components/SideBar";
export default function AdminPage() {
  return (
    <>
      <DashboardLayoutBranding isAdmin={true}/>
    </>
  );
}