import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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
      const cartInstance = [...cart];
      const productIndex = cart.findIndex((cartItem) => cartItem.id === productId)
      if (productIndex >= 0) {
        cartInstance.splice(productIndex, 1)
        console.log('cart', cartInstance)
        setCart(cartInstance)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartInstance))
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId: id,
    amount,
  }: UpdateProductAmount) => {
    try {
      const cartInstance = [...cart];

      if (amount >= 1) {
        const stock = await api.get(`/stock/${id}`);

        if (amount <= stock.data.amount) {
          cartInstance.map((cartItem: Product) => {
            if (cartItem.id === id) {
              cartItem.amount = amount;
              return cartItem
            }
            return cartItem;
          })
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
       
      } else {
        toast.error('Erro na alteração de quantidade do produto');
        return
      }
      
      setCart(cartInstance)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartInstance))
    } catch(error) {
      toast.error('Erro na alteração de quantidade do produto');
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
