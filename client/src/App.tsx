import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import FieldGuide from "@/pages/FieldGuide";
import About from "@/pages/About";
import Account from "@/pages/Account";
import Community from "@/pages/Community";
import Education from "@/pages/Education";



function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/app" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/account" component={Account} />
      {/* Premium route removed */}
      <Route path="/field-guide" component={FieldGuide} />
      <Route path="/about" component={About} />
      <Route path="/community" component={Community} />
      <Route path="/education" component={Education} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Router />
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
