import { useNavigate } from "react-router-dom";
import TopAppBar from "../../components/nav/TopAppBar";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Card from "../../components/ui/Card";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-surface-container to-surface">
      <TopAppBar role="AUTH" />
      <div className="flex-1 flex items-center justify-center px-margin-mobile pt-14">
        <Card className="w-full max-w-sm border-t-4 border-t-error text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-error-container/60 flex items-center justify-center mb-4">
            <Icon name="lock" className="text-error !text-3xl" />
          </div>
          <h1 className="text-headline-md font-bold mb-2">Access Not Authorised</h1>
          <p className="text-body-md text-on-surface-variant mb-6">
            Your wallet does not have the permissions needed for this section.
          </p>

          <Button variant="navy" size="lg" onClick={() => navigate(-1)} className="mb-3">
            Go Back
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/role-select")}
            icon={<Icon name="arrow_forward" />}
            iconPosition="right"
          >
            Sign in as a different role
          </Button>

          <hr className="my-5 border-outline-variant" />
          <p className="text-label-md text-on-surface-variant uppercase tracking-wide mb-2">
            Technical error context
          </p>
          <div className="bg-surface-container rounded-lg p-3">
            <code className="text-label-sm text-on-surface-variant font-mono break-all">
              ERR_AUTH_FORBIDDEN_ROLE_0x19C_ORIGINSHEAR
            </code>
          </div>
        </Card>
      </div>
    </div>
  );
}
