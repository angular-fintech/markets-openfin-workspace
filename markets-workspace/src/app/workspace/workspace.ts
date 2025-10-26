import {Component, OnInit} from '@angular/core';
import {
  Dock,
  DockButtonNames,
  DockProviderRegistration, Home,
  RegistrationMetaInfo, Storefront, StorefrontFooter, StorefrontLandingPage, WorkspaceButton,
  WorkspaceButtonsConfig
} from '@openfin/workspace';
import {CustomActionsMap, getCurrentSync, init} from '@openfin/workspace-platform';
import type { fin as FinApi } from "@openfin/core";

declare global {
  const fin: typeof FinApi;
}


@Component({
  selector: 'app-workspace',
  imports: [],
  templateUrl: './workspace.html',
  styleUrl: './workspace.css',
})
export class Workspace implements OnInit {


  PLATFORM_ID = "markets-workspace";
  PLATFORM_TITLE = "Register With Dock Basic";
  PLATFORM_ICON = "http://localhost:4200/favicon.ico";
  private registration: DockProviderRegistration | undefined;

  workspaceComponents: WorkspaceButton[] = [];

  constructor() {

  }

  ngOnInit(): void {

    this.workspaceComponents.push("home");
    this.workspaceComponents.push("notifications");
    this.workspaceComponents.push("store");
    this.workspaceComponents.push("switchWorkspace");


    this.InitStuff().then(value => {

      console.log("Workspace initialized");
    });


  }


  async InitStuff(){

    await this.initializeWorkspacePlatform()
    const platform = fin.Platform.getCurrentSync();

    await platform.once("platform-api-ready", async () => {

      console.log("Platform API ready");
      await this.initializeWorkspaceComponents();

    });


  }


  /**
   * Initialize the workspace platform.
   */
  async initializeWorkspacePlatform(): Promise<void> {
    console.log("Initializing workspace platform");
    await init({
      browser: {
        defaultWindowOptions: {
          icon: this.PLATFORM_ICON,
          workspacePlatform: {
            pages: [],
            favicon: this.PLATFORM_ICON
          }
        }
      },
      theme: [
        {
          label: "Default",
          default: "dark",
          palette: {
            brandPrimary: "#0A76D3",
            brandSecondary: "#383A40",
            backgroundPrimary: "#1E1F23"
          }
        }
      ],
      // Get the custom actions from the dock which will be triggered
      // when the buttons are clicked
      customActions: this.dockGetCustomActions()
    });
  }


  /**
   * Initialize minimal workspace components for home/store so that the buttons show on dock.
   */
  async initializeWorkspaceComponents(): Promise<void> {
    await Home.register({
      title: this.PLATFORM_TITLE,
      id: this.PLATFORM_ID,
      icon: this.PLATFORM_ICON,
      onUserInput: async () => ({ results: [] }),
      onResultDispatch: async () => {}
    });

    await Storefront.register({
      title: this.PLATFORM_TITLE,
      id: this.PLATFORM_ID,
      icon: this.PLATFORM_ICON,
      getApps: async () => [],
      getLandingPage: async () => ({}) as StorefrontLandingPage,
      getNavigation: async () => [],
      getFooter: async () => ({ logo: { src: this.PLATFORM_ICON }, links: [] }) as unknown as StorefrontFooter,
      launchApp: async () => {}
    });

    await this.registerDock({
      workspaceComponents: this.workspaceComponents
    })

    await Dock.show();

    const providerWindow = fin.Window.getCurrentSync();
    await providerWindow.once("close-requested", async () => {
      await fin.Platform.getCurrentSync().quit();
    });
  }


  /**
   * Get the actions that will be triggered by the button clicks.
   * The action are added to the workspace platform when it is created.
   * @returns The maps of the custom actions.
   */
   dockGetCustomActions(): CustomActionsMap {
    return {
      "launch-google": async (): Promise<void> => {
        const platform = getCurrentSync();
        await platform.createView({ url: "https://www.google.com" });
      },
      "launch-bing": async (): Promise<void> => {
        const platform = getCurrentSync();
        await platform.createView({ url: "https://www.bing.com" });
      }
    };
  }


  /**
   * Register the dock provider.
   * @param id The id to register the provider with.
   * @param title The title to use for the dock registration.
   * @param icon The icon to use for the dock registration.
   * @param options The options to pass to the dock provider.
   * @param options.workspaceComponents The workspace buttons.
   * @param options.disableUserRearrangement Stop the user from rearranging the buttons.
   * @param options.customIconUrl Use a custom icon url.
   * @param options.customOpenUrl Use a custom open url.
   * @returns The registration details for dock.
   */
  async  registerDock(
    options: {
      workspaceComponents: WorkspaceButtonsConfig;

    }
  ): Promise<RegistrationMetaInfo | undefined> {
    console.log("Initializing the dock provider.");

    try {
      this.registration = await Dock.register({
        id: this.PLATFORM_ID,
        title: this.PLATFORM_TITLE,
        icon: this.PLATFORM_ICON,
        workspaceComponents: options.workspaceComponents,
        disableUserRearrangement: false,
        skipSavedDockProviderConfig: true,
        buttons: [
          {
            tooltip: "Google",
            iconUrl: "https://www.google.com/favicon.ico",
            action: {
              id: "launch-google"
            },
            contextMenu: {
              removeOption: true
            }
          },
          {
            tooltip: "Bing",
            iconUrl: "https://www.bing.com/favicon.ico",
            action: {
              id: "launch-bing"
            },
            contextMenu: {
              removeOption: true
            }
          }
        ]
      });
      console.log(this.registration);
      console.log("Dock provider initialized.");
      return this.registration;
    } catch (err) {
      console.error("An error was encountered while trying to register the content dock provider", err);
    }
    return undefined;
  }


}
