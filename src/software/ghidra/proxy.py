import ghidra_bridge
import code
import textwrap
import os

#b = ghidra_bridge.GhidraBridge(namespace=globals())
#code.interact(local=locals())


class GhidraMethods: 

    def __init__ (self):
        self.b = None
        self.flat = None


    def connect_to_ghidra(self):
        try:
            self.b = ghidra_bridge.GhidraBridge(namespace=globals())
            self.flat = self.b.get_flat_api()
            return self.b, "connected"
        
        except Exception as e:
            return None, f"disconnected: {e}"


    def go_to_address(self, address_bin):
        if (self.flat is None):
            print("Not connected to Ghidra")
            return
        
        if (address_bin == None):
            print("address_bin is not available.")
            return

        if ('currentProgram' not in globals()):
            print("currentProgram is not available.")
            return
      
      
        try:
            addr = self.flat.toAddr(address_bin)
            if addr is None:
                print(f"Invalid address: {address_bin}")
                return False

            success = self.flat.goTo(addr)
            if success:
                print(f"Navigated to {address_bin}")
            else:
                print(f"Failed to navigate to {address_bin}")
            return success


        except Exception as e:
            print(f"Exception in go_to_address: {e}")
            return False