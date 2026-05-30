
import detectEthereumProvider from '@metamask/detect-provider';

export class MetaMaskService {
  static async connect(): Promise<{address: string} | {error: string}> {
    if (typeof window === 'undefined') return { error: "Window not defined" };
    
    try {
      console.log("MetaMask: Starting connection attempt...");
      
      // Try to detect the provider
      let provider: any = await detectEthereumProvider({ mustBeMetaMask: false, timeout: 4000 });
      
      // Manual fallback if detection fails (common in some iframes)
      if (!provider && (window as any).ethereum) {
        console.log("MetaMask: detectEthereumProvider failed/timed out, using window.ethereum direct access.");
        provider = (window as any).ethereum;
      }
      
      if (!provider) {
        let msg = "MetaMask is not installed or not detected. ";
        if (window.self !== window.top) {
          msg += "Note: MetaMask is often blocked inside iframes like this one. To use MetaMask, please click the 'Open in New Tab' icon in the top right corner of your browser to open the application directly.";
        } else {
          msg += "Please ensure the MetaMask extension is installed and active in your browser.";
        }
        return { error: msg };
      }

      // Handle the case where there's a provider but it's not MetaMask
      let ethereum = provider;
      if (provider.providers && Array.isArray(provider.providers)) {
        ethereum = provider.providers.find((p: any) => p.isMetaMask) || provider.providers[0];
      }
      
      if (!ethereum) {
          return { error: "Ethereum provider detected but could not be initialized. Please refresh the page." };
      }

      // Check if we are in an iframe (AI Studio context)
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        console.warn("MetaMask: Detected iframe context. Requests may be blocked by browser policy.");
      }

      // Try requesting accounts directly first
      let accounts: string[] = [];
      try {
        // First check if already authorized
        const existingAccounts = await ethereum.request({ method: 'eth_accounts' });
        if (existingAccounts && existingAccounts.length > 0) {
          accounts = existingAccounts;
        } else {
          // If not in iframe, standard eth_requestAccounts
          // If in iframe, some browsers (Brave, Chrome) block eth_requestAccounts unless permissions are requested
          try {
            accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          } catch (innerReqErr: any) {
            if (isInIframe && (innerReqErr.code === -32603 || innerReqErr.code === -32000)) {
                // Try permission request fallback immediately for iframes
                const perms = await ethereum.request({
                    method: 'wallet_requestPermissions',
                    params: [{ eth_accounts: {} }]
                });
                if (perms) {
                    accounts = await ethereum.request({ method: 'eth_requestAccounts' });
                }
            } else {
                throw innerReqErr;
            }
          }
        }
      } catch (reqErr: any) {
        // Handle "Request of type 'eth_requestAccounts' already pending"
        if (reqErr.code === -32002) {
          return { error: "A connection request is already pending in MetaMask. Please check your extension notification (top right corner of your browser)." };
        }
        
        // Handle rejection
        if (reqErr.code === 4001) return { error: "Connection request rejected by user." };

        // Generic fallback for RPC errors
        if (reqErr.code === -32603 || reqErr.code === -32601 || reqErr.code === -32000) {
             try {
                const perms = await ethereum.request({
                    method: 'wallet_requestPermissions',
                    params: [{ eth_accounts: {} }]
                });
                if (perms) {
                    accounts = await ethereum.request({ method: 'eth_requestAccounts' });
                }
             } catch (permErr: any) {
                 if (permErr.code === 4001) return { error: "Permission request rejected." };
                 throw permErr;
             }
        } else {
            throw reqErr;
        }
      }
      
      if (accounts && accounts.length > 0) {
        return { address: accounts[0] };
      } else {
        return { error: "No accounts found after connection. Please ensure your wallet is unlocked and authorized." };
      }
    } catch (err: any) {
      if (err.code === 4001) {
        return { error: "Connection request rejected by user." };
      }
      console.error("MetaMask connection failed:", err);
      
      let message = err.message || 'Unknown error';
      if (window.self !== window.top) {
          message += ". Note: MetaMask often fails when running inside an iframe (like AI Studio). Try opening the application in a new tab using the 'Open in New Tab' icon in the top right.";
      }
      
      return { error: `Failed to connect to MetaMask: ${message}` };
    }
  }

  static isInstalled(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
  }

  static async getSelectedAddress(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const ethereum = (window as any).ethereum;
    if (!ethereum) return null;
    
    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    } catch {
      return null;
    }
  }
}
