module QCSim.Zhegalkin where

import Prelude (($), (/=), (+))
import Data.Monoid ((<>))
import Data.Functor (map)
import Data.List.Lazy (take, length, iterate, uncons, List, nil, (:), singleton)
import Data.Array (fromFoldable, toUnfoldable) as A
import Control.Semigroupoid ((<<<))
import Data.Maybe (Maybe (Just, Nothing))
import Data.Eq

-- TT = truth table
-- TTs are being encoded as a (List Boolean) containing the last column of the table.
class TT a where
  toTT :: a -> List Boolean
  arity :: a -> Int

-- Now we define instances of TT for logical functions of any arity using induction principle.

-- base: Boolean is a zero arity function which truth table consists of a single value.
instance ttB :: TT Boolean where
  toTT = singleton
  arity _ = 0

-- induction step: for any TT a => f :: Boolean -> a, TT can be constructed by applying both 'False' and 'True'
-- and concatenating the resulting tables.
instance ttB' :: TT a => TT (Boolean -> a) where
  toTT f =  toTT (f false) <> toTT (f true)
  arity f = 1 + arity (f false)

-- | XOR definition.
xor :: forall a. Eq a => a -> a -> Boolean
xor = (/=)

{- e.g.

reduce f [a, b, c, d] = [a `f` b, b `f` c, c `f` d]
-}
reduce :: forall a . (a -> a -> a) -> List a -> List a
reduce f l =
  case uncons l of
    Just { head: x, tail } ->
      case uncons tail of
        Just { head: y, tail: _ } ->
          x `f` y : reduce f tail
        Nothing -> nil
    Nothing -> nil

{- Table method, or triangle method.

https://en.wikipedia.org/wiki/Zhegalkin_polynomial#Using_tables
-}
triangleL :: List Boolean -> List (List Boolean)
triangleL list = take (length list) $ iterate (reduce xor) list

triangle :: Array Boolean -> Array (Array Boolean)
triangle = A.fromFoldable <<< map A.fromFoldable <<< triangleL <<< A.toUnfoldable
