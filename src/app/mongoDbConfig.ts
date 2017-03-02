export default function mongoDbConfig() {
  return {
    async start({ endpoints }) {
      const { getServiceAddress } = endpoints
      const {host, port} = endpoints.getServiceEndpoint('localhost:3003')
      return {
        mongodb: {
          db: "flowershop"
        }
      }
    }
  }
}