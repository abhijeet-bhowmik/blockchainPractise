#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error, print all commands.
set -ev

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

docker-compose -f docker-compose.yaml down

docker-compose -f docker-compose.yaml up -d

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
export FABRIC_START_TIMEOUT=10
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}

# Create the channel
docker exec -e "CORE_PEER_LOCALMSPID=NewputMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@newput.business.com/msp" peer0.newput.business.com peer channel create -o orderer.business.com:7050 -c primarychannel -f /etc/hyperledger/configtx/channel.tx


# get the channel.block file to the shared folder
docker exec -it peer0.newput.business.com cp ./primarychannel.block /etc/hyperledger/sharedVolume

# Join peers to the channel.

############## Newput ####################
docker exec -e "CORE_PEER_LOCALMSPID=NewputMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@newput.business.com/msp" peer0.newput.business.com peer channel join -b /etc/hyperledger/sharedVolume/primarychannel.block
docker exec -e "CORE_PEER_LOCALMSPID=NewputMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@newput.business.com/msp" peer0.newput.business.com  peer channel update -o orderer.business.com:7050 -c primarychannel -f /etc/hyperledger/configtx/NewputMSPanchors.tx
##########################################


sleep 5


############## Sentient ####################
docker exec -e "CORE_PEER_LOCALMSPID=SentientMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@sentient.business.com/msp" peer0.sentient.business.com peer channel join -b /etc/hyperledger/sharedVolume/primarychannel.block
docker exec -e "CORE_PEER_LOCALMSPID=SentientMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@sentient.business.com/msp" peer0.sentient.business.com  peer channel update -o orderer.business.com:7050 -c primarychannel -f /etc/hyperledger/configtx/SentientMSPanchors.tx
##########################################


sleep 5

############## Sentient ####################
docker exec -e "CORE_PEER_LOCALMSPID=CapitalCityMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@capitalcity.business.com/msp" peer0.capitalcity.business.com peer channel join -b /etc/hyperledger/sharedVolume/primarychannel.block
docker exec -e "CORE_PEER_LOCALMSPID=CapitalCityMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@capitalcity.business.com/msp" peer0.capitalcity.business.com  peer channel update -o orderer.business.com:7050 -c primarychannel -f /etc/hyperledger/configtx/CapitalCityMSPanchors.tx
##########################################

