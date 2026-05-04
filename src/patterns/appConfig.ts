/** 
 * Singleton class managing application configuration and state.
 * This class ensures only one instance manages config values across the app.
*/ 

export class AppConfig {
  // Private Static Instance Variable: holds the single instance of AppConfig
  private static instance: AppConfig;
  
  readonly baseUrl: string;
  readonly employeeId: string;
  readonly branchId: string;
  readonly branchName: string;
  readonly userName: string;

  // Private Constructor: prevents external instantiation 
  private constructor() {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    this.baseUrl = `${BASE_URL}`;
    this.employeeId = sessionStorage.getItem('userId') ?? '';
    this.branchId = sessionStorage.getItem('activeBranchId') ?? '';
    this.branchName = sessionStorage.getItem('branchName') ?? '';
    this.userName = sessionStorage.getItem('userName') ?? '';
  }

  // Public Static Method: provides access to the single instance of AppConfig
  static getInstance(): AppConfig {
    if (!AppConfig.instance) AppConfig.instance = new AppConfig();
    return AppConfig.instance;
  }
}