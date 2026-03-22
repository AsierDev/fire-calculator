import { BridgeChart } from "./components/BridgeChart";
import { ConvenioBreakdown } from "./components/ConvenioBreakdown";
import { CustomAgeSlider } from "./components/CustomAgeSlider";
import { FireSummaryCard } from "./components/FireSummaryCard";
import { InputPanel } from "./components/InputPanel";
import { Layout } from "./components/Layout";
import { MonteCarloChart } from "./components/MonteCarloChart";
import { PortfolioChart } from "./components/PortfolioChart";
import { ResultsTable } from "./components/ResultsTable";

function App() {
  return (
    <Layout sidebar={<InputPanel />}>
      <FireSummaryCard />
      <ResultsTable />
      <CustomAgeSlider />
      <PortfolioChart />
      <BridgeChart />
      <MonteCarloChart />
      <ConvenioBreakdown />
    </Layout>
  );
}

export default App;
