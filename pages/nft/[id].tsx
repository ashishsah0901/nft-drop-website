import Head from 'next/head'
import {
  useAddress,
  useDisconnect,
  useMetamask,
  useNFTDrop,
} from '@thirdweb-dev/react'
import { GetServerSideProps } from 'next'
import { sanityClient, urlFor } from '../../sanity'
import { Collection } from '../../typing'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BigNumber } from 'ethers'
import toast, { Toaster } from 'react-hot-toast'

interface Props {
  collection: Collection
}

const NftDropPage = ({ collection }: Props) => {
  const [claimedSupply, setClaimedSupply] = useState<Number>(0)
  const [totalSupply, setTotalSupply] = useState<BigNumber>()
  const [loading, setLoading] = useState<boolean>(true)
  const [priceInEth, setPriceInEth] = useState<string>()

  const connectWithMetamask = useMetamask()
  const address = useAddress()
  const disconnect = useDisconnect()
  const nftDrop = useNFTDrop(collection.address)

  useEffect(() => {
    if (!nftDrop) return
    const fetchNftDropData = async () => {
      setLoading(true)
      const claimed = await nftDrop.getAllClaimed()
      const total = await nftDrop.totalSupply()
      const claimConditions = await nftDrop.claimConditions.getAll()
      setPriceInEth(claimConditions[0]?.currencyMetadata.displayValue)
      setClaimedSupply(claimed.length)
      setTotalSupply(total)
      setLoading(false)
    }
    fetchNftDropData()
  }, [nftDrop])

  const mintNft = () => {
    if (!nftDrop || !address) return
    const quantity = 1
    setLoading(true)
    const notification = toast.loading('Minting...', {
      style: {
        background: 'white',
        color: 'green',
        fontWeight: 'bolder',
        fontSize: '17px',
        padding: '20px',
      },
    })
    nftDrop
      .claimTo(address, quantity)
      .then(async (tx) => {
        const receipt = tx[0].receipt
        toast(
          `You successfully minted ${receipt.blockHash.substring(
            0,
            5
          )}...${receipt.blockHash.substring(receipt.blockHash.length - 5)}`,
          {
            style: {
              background: 'green',
              color: 'white',
              fontWeight: 'bolder',
              fontSize: '17px',
              padding: '20px',
            },
            duration: 8000,
          }
        )
      })
      .catch((error) => {
        toast('Something went wrong', {
          style: {
            background: 'red',
            color: 'white',
            fontWeight: 'bolder',
            fontSize: '17px',
            padding: '20px',
          },
          duration: 8000,
        })
        console.log(error)
      })
      .finally(() => {
        setLoading(false)
        toast.dismiss(notification)
      })
  }

  return (
    <div className="flex h-screen flex-col lg:grid lg:grid-cols-10">
      <Head>
        <title>Token</title>
      </Head>
      <Toaster position="bottom-center" />
      <div className="bg-gradient-to-br from-cyan-800 to-rose-800 lg:col-span-4">
        <div className="flex flex-col items-center justify-center p-2 lg:min-h-screen">
          <div className="rounded-xl bg-gradient-to-br from-yellow-400 to-purple-600 p-2">
            <img
              src={urlFor(collection.previewImage).url()}
              alt=""
              className="w-44 rounded-xl object-cover lg:h-96 lg:w-72"
            />
          </div>
          <div className="space-y-2 p-5 text-center">
            <h1 className="text-4xl font-bold text-white">
              {collection.title}
            </h1>
            <h2 className="text-xl text-gray-300">{collection.description}</h2>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-12 lg:col-span-6">
        <header className="flex items-center justify-between">
          <Link href="/">
            <h1 className="w-52 cursor-pointer text-xl font-extralight sm:w-80">
              The{' '}
              <span className="font-extrabold underline decoration-pink-600/50">
                NFT
              </span>{' '}
              Marketplace
            </h1>
          </Link>
          <button
            className="rounded-full bg-rose-400 py-2 px-4 text-xs font-bold text-white lg:px-5 lg:py-3 lg:text-base"
            onClick={() => (address ? disconnect() : connectWithMetamask())}
          >
            {address ? 'Sign Out' : 'Sign In'}
          </button>
        </header>
        <hr className="my-2 border" />
        {address && (
          <p className="text-center text-sm text-rose-400">
            You're logged in with wallet {address.substring(0, 5)}...
            {address.substring(address.length - 5)}
          </p>
        )}
        <div className="mt-10 flex flex-1 flex-col items-center space-y-6 text-center lg:justify-center lg:space-y-0">
          <img
            className="w-80 object-cover pb-10 lg:h-40"
            src={urlFor(collection.mainImage).url()}
            alt=""
          />
          <h1 className="text-3xl font-bold lg:text-5xl lg:font-extrabold">
            {collection.title}
          </h1>
          {loading ? (
            <p className="animate-pulse pt-2 text-xl text-green-500">
              Loading Supply Count...
            </p>
          ) : (
            <p className="pt-2 text-xl text-green-500">
              {claimedSupply} / {totalSupply?.toString()} NFT's claimed
            </p>
          )}
          {loading && (
            <img
              className="h-80 w-80 object-contain"
              src="https://cdn.hackernoon.com/images/0*4Gzjgh9Y7Gu8KEtZ.gif"
              alt=""
            />
          )}
        </div>
        <button
          disabled={
            loading || claimedSupply === totalSupply?.toNumber() || !address
          }
          onClick={mintNft}
          className="mt-10 h-16 w-full rounded-full bg-red-600 font-bold text-white disabled:bg-gray-400"
        >
          {loading ? (
            <>Loading...</>
          ) : claimedSupply === totalSupply?.toNumber() ? (
            <>Sold Out</>
          ) : !address ? (
            <>Login to Mint</>
          ) : (
            <span className="font-bold">MINT NFT ({priceInEth} ETH)</span>
          )}
        </button>
      </div>
    </div>
  )
}

export default NftDropPage

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const query = `*[_type == "collection" && slug.current == $id]{
    _id,
    title,
    address,
    description,
    nftCollectionName,
    mainImage {
      asset
    },
    previewImage {
      asset
    },
    slug {
      current
    },
    creator -> {
      _id,
      name,
      address,
      slug {
        current
      },
    }
  }`
  const collection = await sanityClient.fetch(query, {
    id: params?.id,
  })
  if (!collection) {
    return {
      notFound: true,
    }
  }
  return {
    props: {
      collection: collection[0],
    },
  }
}
