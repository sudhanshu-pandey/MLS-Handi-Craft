import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import addressService from '../../services/address.service';

export type Address = {
  _id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
};

type AddressState = {
  addresses: Address[];
  loading: boolean;
  error: string | null;
  defaultAddressId: string | null;
};

const initialState: AddressState = {
  addresses: [],
  loading: false,
  error: null,
  defaultAddressId: null,
};

// Async thunks
export const fetchAddresses = createAsyncThunk(
  'address/fetchAddresses',
  async () => {
    const result = await addressService.getAddresses();
    if (result.success) {
      return result.addresses;
    }
    throw new Error(result.error);
  }
);

export const addNewAddress = createAsyncThunk(
  'address/addAddress',
  async (addressData: any) => {
    const result = await addressService.addAddress(addressData);
    if (result.success) {
      return result.addresses || [result.address];
    }
    throw new Error(result.error);
  }
);

export const updateAddressAsync = createAsyncThunk(
  'address/updateAddress',
  async ({ addressId, data }: { addressId: string; data: any }) => {
    const result = await addressService.updateAddress(addressId, data);
    if (result.success) {
      return result.addresses || [result.address];
    }
    throw new Error(result.error);
  }
);

export const deleteAddressAsync = createAsyncThunk(
  'address/deleteAddress',
  async (addressId: string) => {
    const result = await addressService.deleteAddress(addressId);
    if (result.success) {
      return result.addresses;
    }
    throw new Error(result.error);
  }
);

export const setDefaultAddressAsync = createAsyncThunk(
  'address/setDefaultAddress',
  async (addressId: string) => {
    const result = await addressService.setDefaultAddress(addressId);
    if (result.success) {
      return {
        addresses: result.addresses,
        defaultAddress: result.address,
      };
    }
    throw new Error(result.error);
  }
);

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch addresses
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
        const defaultAddr = state.addresses.find(addr => addr.isDefault);
        state.defaultAddressId = defaultAddr?._id || null;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch addresses';
      });

    // Add address
    builder
      .addCase(addNewAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewAddress.fulfilled, (state, action) => {
        state.loading = false;
        // Replace entire addresses array with the response
        state.addresses = action.payload;
        // Update default if any address is set as default
        const defaultAddr = action.payload.find((a: any) => a.isDefault);
        if (defaultAddr) {
          state.defaultAddressId = defaultAddr._id;
        }
      })
      .addCase(addNewAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add address';
      });

    // Update address
    builder
      .addCase(updateAddressAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAddressAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Replace entire addresses array with the response
        state.addresses = action.payload;
      })
      .addCase(updateAddressAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update address';
      });

    // Delete address
    builder
      .addCase(deleteAddressAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAddressAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
        const defaultAddr = state.addresses.find(addr => addr.isDefault);
        state.defaultAddressId = defaultAddr?._id || null;
      })
      .addCase(deleteAddressAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete address';
      });

    // Set default address
    builder
      .addCase(setDefaultAddressAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setDefaultAddressAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload.addresses;
        state.defaultAddressId = action.payload.defaultAddress._id;
      })
      .addCase(setDefaultAddressAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to set default address';
      });
  },
});

export default addressSlice.reducer;
