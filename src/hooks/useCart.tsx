import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const cartInstance = [...cart];
      const existentProduct = cart.find((cartItem) => cartItem.id === productId)

      if(existentProduct) {
        const stock = await api.get(`/stock/${productId}`);
        if (existentProduct.amount < stock.data.amount) {
          cartInstance.map((cartItem: Product) => {
            if (cartItem.id === existentProduct.id) {
              cartItem.amount += 1;
              return cartItem
            }
            return cartItem;
          })
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }
      } else {
        const product = await api.get(`/products/${productId}`);
        const newCartItem = {
          ...product.data,
          amount: 1,
        }
        cartInstance.push(newCartItem)
      }
      setCart(cartInstance)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartInstance))
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId: id,
    amount,
  }: UpdateProductAmount) => {
    try {
      const products = await api.get('/products');
      console.log('PRODUCTS', products);
      setCart([...cart])
    } catch(error) {
      console.log(error)
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
