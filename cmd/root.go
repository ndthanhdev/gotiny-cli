package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/spf13/cobra"
)

func String(v string) *string { return &v }
func Bool(v bool) *bool       { return &v }

type ShortenPayload struct {
	Long        string  `json:"long"`
	UseFallback *bool   `json:"useFallback,omitempty"`
	Custom      *string `json:"custom,omitempty"`
}

type ApiSuccess = []Shorten

type Shorten struct {
	Long string `json:"long"`
	Code string `json:"code"`
}

type ApiError struct {
	Error *struct {
		Source  string `json:"source"`
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func Execute() {

	var useFallback bool
	var custom string

	var rootCmd = &cobra.Command{
		Use:   "gotiny <long-url>",
		Short: "Shorten any URL",
		Long:  `Shorten any URL from terminal using gotiny.cc, a lightweight, fast, secure... URL shortener.`,

		Version: "1.0.4",

		Args: cobra.RangeArgs(1, 1),

		Run: func(cmd *cobra.Command, args []string) {
			// Do Stuff Here
			long := args[0]

			payload, _ := json.Marshal(ShortenPayload{
				Long:        long,
				UseFallback: &useFallback,
				Custom:      &custom,
			})

			buf := bytes.NewBuffer(payload)

			rep, repErr := http.Post("https://gotiny.cc/api", "application/json", buf)

			if repErr != nil {
				fmt.Println(repErr)
				os.Exit(1)
				return
			}

			resBody, resErr := ioutil.ReadAll(rep.Body)

			if resErr != nil {
				fmt.Println(resErr)
				os.Exit(1)
				return
			}

			var apiRes ApiSuccess
			var parseSuccessError error = nil

			var apiError ApiError
			var parseErrorError error = nil

			parseSuccessError = json.Unmarshal(resBody, &apiRes)

			if parseSuccessError == nil {
				shorten := apiRes[0]
				fmt.Println("https://gotiny.cc" + "/" + shorten.Code)
				return
			}

			parseErrorError = json.Unmarshal(resBody, &apiError)

			if parseSuccessError == nil {
				fmt.Println(apiError.Error.Message)
				os.Exit(1)
				return
			}

			fmt.Println("Failed to parse response")
			fmt.Println(parseSuccessError)
			fmt.Println(parseErrorError)
			os.Exit(1)
		},
	}

	rootCmd.Flags().StringVarP(&custom, "custom", "c", "", `Generates a custom link (e.g. gotiny.cc/custom-link). Custom codes should consist of 4-32 lowercase letters, numbers, - and/or _ symbols.`)

	rootCmd.Flags().BoolVar(&useFallback, "useCallback", false, "Set to false if you don't want to use a randomly generated 6-character fallback code and throw an error instead when a custom code can't be used.")

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
