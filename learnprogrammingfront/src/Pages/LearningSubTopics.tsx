import React, { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Text,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { LearningSubTopicsType } from "../Types/LearningSubTopicsType";
import { LearningTopicTypes } from "../Types/LearningTopicsTypes";
import { AddNewSubTopic } from "../Components/AddNewSubTopic";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { UserRole } from "../Constants/RolesConstants";
import eventBus from "../Helpers/EventBus";
import toast from "react-hot-toast";
import { EditChosenSubTopic } from "../Components/EditChosenSubTopic";

const LearningSubTopics = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  const [subtopics, setSubTopics] = useState<LearningSubTopicsType[]>([]);
  const { state } = useLocation();
  const [topic, setTopic] = useState<LearningTopicTypes>();
  const [isLoading, setIsLoading] = useState(true);
  const role = localStorage.getItem("role");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deletingId, setDeletingId] = useState<number>();

  const openModal = (id: number) => {
    setDeletingId(id);
    onOpen();
  };

  const NavigateToTask = (subTopicId: number) => {
    navigate("/uzduotys", {
      state: {
        learningTopicId: state.learningTopicId,
        subTopicId: subTopicId,
      },
    });
  };

  const getLearningTopicName = useCallback(async () => {
    const response = await fetch(
      `https://localhost:7266/api/learningtopic/${state.learningTopicId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "GET",
      }
    );
    const allTopics = await response.json();
    setTopic(allTopics);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getLearningTopicName();
  }, [isLoading]);

  const getLearningSubTopics = useCallback(async () => {
    const response = await fetch(
      `https://localhost:7266/api/learningtopic/${state.learningTopicId}/subtopic`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "GET",
      }
    );
    const topic = await response.json();
    setSubTopics(topic);
  }, []);

  useEffect(() => {
    getLearningSubTopics();
  }, [isLoading]);

  const EditSubTopic = useCallback(
    async (
      e: FormEvent<HTMLFormElement>,
      subTopicName: string,
      subTopicId: number
    ): Promise<void> => {
      e.preventDefault();
      const response = await fetch(`https://localhost:7266/api/learningtopic/${state.learningTopicId}/subtopic/${subTopicId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "PUT",
        body: JSON.stringify({
          subTopicName,
        }),
      });
      if (response.status === 401) {
        eventBus.dispatch("logOut", "");
      } else if (response.status === 200) {
        setIsLoading(true);
        toast.success("Potemė atnaujinta!");
      } else {
        toast.error("Nepavyko!");
      }
    },
    []
  );

  const deleteLearningSubTopic = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    subTopicId: number
  ): Promise<void> => {
    e.preventDefault();
    const response = await fetch(
      `https://localhost:7266/api/learningtopic/${state.learningTopicId}/subtopic/${subTopicId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "DELETE",
      }
    );

    if (response.status === 204) {
      setIsLoading(true);
      toast.success("Potemė ištrinta!");
      onClose();
    } else {
      toast.error("Nepavyko ištrinti!");
    }
  };

  const AddLearningSubTopic = useCallback(
    async (
      e: FormEvent<HTMLFormElement>,
      subTopicName: string
    ): Promise<void> => {
      e.preventDefault();
      const response = await fetch(
        `https://localhost:7266/api/learningtopic/${state.learningTopicId}/subtopic`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          method: "POST",
          body: JSON.stringify({
            subTopicName,
          }),
        }
      );
      if (response.status === 401) {
        eventBus.dispatch("logOut", "");
      } else if (response.status === 201) {
        setIsLoading(true);
        toast.success("Potemė pridėta!");
      } else {
        toast.error("Nepavyko!");
      }
    },
    []
  );

  if (isLoading) {
    return (
      <Flex justifyContent="center" top="50%" left="50%" position="fixed">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <>
      <Box className="container" mt={10}>
        <Grid className="col-md-12">
          <Flex justifyContent={"center"}>
            <Box>
              <Heading fontFamily={"Roboto"} size={"lg"}>„{topic?.title}“ potemės</Heading>
            </Box>
          </Flex>
          {role === UserRole.Teacher && (
            <>
              <AddNewSubTopic AddLearningSubTopic={AddLearningSubTopic} />
            </>
          )}
          {subtopics.map((subtopic) => {
            return (
              <Flex justify={"center"}>
              <Box mt={3} width={"50%"} >
                <Flex flexDir={"column"}>
                  <Flex
                    justifyContent={"space-between"}
                    border={"1px solid black"}
                    padding={"10px"}
                    borderRadius={"5px"}
                    marginTop={"12px"}
                    bg={"white"}
                  >
                    <Flex
                      alignItems={"center"}
                      justifyContent={"space-between"}
                      width={"100%"}
                    >
                      <Flex align={"center"} wordBreak={"break-all"}>
                        <Heading
                          position="relative"
                          fontFamily={"Roboto"}
                          color="black"
                          fontWeight="semibold"
                          letterSpacing="wide"
                          textTransform="uppercase"
                          size="sm"
                          cursor="pointer"
                          display={{ base: "none", xs: "block" }}
                          onClick={() => NavigateToTask(subtopic.id)}
                          _hover={{
                            _after: {
                              transform: "scaleX(1)",
                              transformOrigin: "bottom left",
                            },
                          }}
                          _after={{
                            content: '" "',
                            position: "absolute",
                            width: "100%",
                            height: "2px",
                            bottom: 0,
                            left: 0,
                            backgroundColor: "black",
                            transform: "scaleX(0)",
                            transformOrigin: "bottom right",
                            transition: "transform 0.25s ease-out",
                          }}
                        >
                          {subtopic.subTopicName}
                        </Heading>
                      </Flex>
                      <Flex
                        justifyContent={"flex-end"}
                        align={"center"}
                        justify={"center"}
                      >
                        <Box
                          color="black"
                          fontWeight="semibold"
                          letterSpacing="wide"
                          textTransform="uppercase"
                          display={{ base: "none", md: "block" }}
                          mr={5}
                        >
                          uždaviniai/ių: {subtopic.numberOfTasks}
                        </Box>
                        {(role === UserRole.Teacher) && (
                          <>
                          <EditChosenSubTopic
                          EditSubTopic={EditSubTopic}
                          TopicId={state.learningTopicId}
                          SubTopicId={subtopic.id}
                        />
                          <DeleteIcon
                            cursor="pointer"
                            onClick={() => openModal(subtopic.id)}
                            color="red.500"
                          />
                          </>
                        )}
                      </Flex>
                    </Flex>
                  </Flex>
                </Flex>
              </Box>
              </Flex>
            );
          })}
        </Grid>
      </Box>
      <>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Perspėjimas!</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Ar tikrai norite ištrinti potemę?</Text>
            </ModalBody>

            <ModalFooter>
              <Button
                background="red.500"
                mr={3}
                onClick={(e) => deleteLearningSubTopic(e, deletingId as number)}
                color={"white"}
                _hover={{
                  bg: "red.700",
                }}
              >
                Ištrinti
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    </>
  );
};

export { LearningSubTopics };
