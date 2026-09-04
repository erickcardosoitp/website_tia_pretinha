import { ApplicationInsights } from '@microsoft/applicationinsights-web'

export const appInsights = new ApplicationInsights({
  config: {
    connectionString:
      'InstrumentationKey=1e41df25-611b-4eeb-989b-67111ba131f0;IngestionEndpoint=https://eastus2-3.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus2.livediagnostics.monitor.azure.com/;ApplicationId=f0189906-695a-46a7-b153-6f66e47d5b1a',
    enableAutoRouteTracking: true,
    disableAjaxTracking: false,
    autoTrackPageVisitTime: true,
  },
})

appInsights.loadAppInsights()
