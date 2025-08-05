import ghidra_bridge


class GhidraMethods: 

    def __init__ (self):
        self.bridge = None
        self.flat_api = None


    def connect_to_ghidra(self):
        try:
            self.bridge = ghidra_bridge.GhidraBridge(namespace=globals())
            self.flat_api = self.bridge.get_flat_api()
            return self.bridge, "connected"
        
        except Exception as e:
            return None, f"disconnected: {e}"


    def go_to_address(self, address_bin):
        if (self.flat_api is None):
            print("Not connected to Ghidra")
            return
        
        if (address_bin == None):
            print("address_bin is not available.")
            return

        if ('currentProgram' not in globals()):
            print("currentProgram is not available.")
            return
      
        try:
            addr = self.flat_api.toAddr(address_bin)
            if addr is None:
                print(f"Invalid address: {address_bin}")
                return False

            success = self.flat_api.goTo(addr)
            if success:
                print(f"Navigated to {address_bin}")
            else:
                print(f"Failed to navigate to {address_bin}")
            return success

        except Exception as e:
            print(f"Exception in go_to_address: {e}")
            return False
        

    def has_active_connection(self):
        if (self.bridge is None or self.flat_api is None):
            return False
        
        try:
            _ = self.flat_api.getCurrentProgram()
            return True
        
        except Exception:
            return False