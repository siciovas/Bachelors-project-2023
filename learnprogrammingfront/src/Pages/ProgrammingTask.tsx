import {
  Box,
  Button,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  Text,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  useDisclosure,
  Heading,
} from "@chakra-ui/react";
import Editor from "@monaco-editor/react";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { defineTheme } from "../defineTheme";
import { run, runTest } from "./compiler";
import eventBus from "../Helpers/EventBus";
import { Unauthorized } from "../Constants/Auth";
import { ProgrammingTaskTypes } from "../Types/ProgrammingTaskTypes";
import toast from "react-hot-toast";
import DOMPurify from "dompurify";
import { ProgrammingTaskTest } from "../Types/ProgrammingTaskTest";
import { UserRole } from "../Constants/RolesConstants";
import { isMobile } from "react-device-detect";

interface ThemeType {
  value: string;
  label: string;
}

const ProgrammingTask = () => {
  const [value, setValue] = useState<string>("");
  const [code, setCode] = useState();
  const [theme, setTheme] = useState<ThemeType>();
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { state } = useLocation();
  const token = localStorage.getItem("accessToken");
  const [taskInformation, setTaskInformation] =
    useState<ProgrammingTaskTypes>();
  const [taskTests, setTaskTests] = useState<ProgrammingTaskTest[]>([]);
  const [grade, setGrade] = useState<number>();
  const role = localStorage.getItem("role");

  const openModal = () => {
    onOpen();
  };

  const postGrade = async (mark: number): Promise<void> => {
    const response = await fetch(`https://localhost:7266/api/grades`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      method: "POST",
      body: JSON.stringify({
        grade: mark,
        programmingTaskId: state.taskId,
      }),
    });
    if (response.status === 401) {
      eventBus.dispatch("logOut", "");
    } else if (response.status === 201 || response.status === 200) {
      toast.success("Įvertinta!");
    } else {
      toast.error("Nepavyko!");
    }
  };

  const getProgrammingTaskInformation = useCallback(async () => {
    const response = await fetch(
      `https://localhost:7266/api/learningtopic/${state.learningTopicId}/subtopic/${state.subTopicId}/task/${state.taskId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "GET",
      }
    );
    if (response.status === 401) {
      eventBus.dispatch("logOut", Unauthorized);
    } else if (response.status === 200) {
      const taskInfo = await response.json();
      setTaskInformation(taskInfo);
      setCode(taskInfo.programmingCode);
      setTaskTests(taskInfo.tests);
      setIsLoading(false);
    } else {
      toast.error("Netikėta klaida!");
    }
  }, []);

  useEffect(() => {
    getProgrammingTaskInformation();
    defineTheme("oceanic-next").then((_) =>
      setTheme({ value: "oceanic-next", label: "Oceanic Next" })
    );
  }, []);

  const compile = async () => {
    await Promise.resolve(run(code))
      .then(() => {
        var output = document.getElementById("output") as any;
        setValue(output.value);
      })
      .catch((result) => {
        toast.error("Kode yra klaidų. Klaidos informacija išvesties eilutėje!");
        setValue(result.toString());
      });
  };

  const evaluate = async () => {
    var testsPassed = 0;
    var mark = 0;
    var error = false;
    for (var i = 0; i < taskTests.length; i++) {
      try {
        const result = await runTest(code, taskTests[i].input);
        console.log(result.toString().replace(/\s+/g, ''));
        const equal = result.toString().replace(/\s+/g, '') === taskTests[i].output.toString().replace(/\s+/g, '');
        console.log(taskTests[i].output.toString().replace(/\s+/g, ''));
        if (equal) {
          console.log("+++");
          testsPassed++;
        }
      }
      catch {
        error = true;
        toast.error("Kodas neatitinka reikalavimų");
        break;
      }
    }
    if (!error) {
      mark = (testsPassed / taskTests.length) * 100;
      setGrade(mark);
      await postGrade(mark);
    }
  };

  const handleEditorChange = (value: any) => {
    setCode(value);
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" top="50%" left="50%" position="fixed">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box mx={8} my={5}>
      <Flex>
        <Heading size="sm" paddingRight={1} fontFamily={"Roboto"}>
          Tema:
        </Heading>
        <Heading size="sm" fontWeight={"none"} fontFamily={"Roboto"}>
          {taskInformation?.learningTopicName}
        </Heading>
      </Flex>
      <Flex>
        <Heading size="sm" paddingRight={1} fontFamily={"Roboto"}>
          Potemė:
        </Heading>
        <Heading size="sm" fontWeight={"none"} fontFamily={"Roboto"}>
          {taskInformation?.subTopicName}
        </Heading>
      </Flex>
      <Flex>
        <Heading size="sm" paddingRight={1} fontFamily={"Roboto"}>
          Uždavinys:
        </Heading>
        <Heading size="sm" fontWeight={"none"} fontFamily={"Roboto"}>
          {taskInformation?.name}
        </Heading>
      </Flex>
      <Flex mt={5} width="100%" >
        <Flex flexDirection={"column"} width="50%">
          <Flex mb={3}>
            <Button
              onClick={compile}
              bg={"black"}
              textColor={"white"}
              _hover={{
                bg: "gray",
              }}
            >
              {isMobile ? "Kompil." : "Kompiliuoti"}
            </Button>
            {(role === UserRole.Student) && (
              <Button
                onClick={openModal}
                bg={"red.500"}
                textColor={"white"}
                _hover={{
                  bg: "red.700",
                }}
                ml={4}
              >
                {isMobile ? "Įvertis" : "Gauti įvertinimą"}
              </Button>
            )}
          </Flex>
          <Editor
            height="50vh"
            width={"100%"}
            language={"python"}
            theme={theme?.value}
            onChange={handleEditorChange}
            value={taskInformation?.programmingCode}
          />
          Išvestis
          <Text
            id="output"
            backgroundColor="#1b2b34"
            textColor="white"
            minH={"25px"}
          >{value}</Text>
          <Box >Įvertis: {grade?.toFixed(2)}%</Box>
        </Flex>
        <Flex flexDirection="column" w="50%" ml={5} mt={5}>
          <Heading size="sm" mb={3} fontFamily={"Roboto"}>Užduoties aprašymas</Heading>
          <Box
            padding={2}
            border={"1px solid black"}
            height={"50vh"}
            bg={"white"}
            overflow={"auto"}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                taskInformation?.description as unknown as Node
              ),
            }}
          ></Box>
        </Flex>
      </Flex>
      <>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Perspėjimas!</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                Ar tikrai pateikti parašytą kodą testavimui?
              </Text>
            </ModalBody>

            <ModalFooter>
              <Button
                background="black"
                mr={3}
                color={"white"}
                _hover={{
                  bg: "gray",
                }}
                onClick={evaluate}
              >
                Įvertinti!
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    </Box>
  );
};

export { ProgrammingTask };
